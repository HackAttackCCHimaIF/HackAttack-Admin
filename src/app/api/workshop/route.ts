import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { WorkshopDB } from "@/lib/interface/workshop";
import { convertWorkshopDBToWorkshop } from "@/lib/utility/typeconverter";
import { EmailService } from "@/lib/services/emailService";
import { NotificationService } from "@/lib/services/notificationService";
import { HistoryService } from "@/lib/services/historyService";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const { data: workshopData, error: workshopError } = await supabaseServer
      .from("Workshop")
      .select("*")
      .order("created_at", { ascending: false });

    if (workshopError) {
      console.error("Error fetching workshop data:", workshopError);
      return NextResponse.json(
        { error: "Failed to fetch workshop data" },
        { status: 500 }
      );
    }

    const workshops = workshopData.map((workshop: WorkshopDB) =>
      convertWorkshopDBToWorkshop(workshop)
    );

    return NextResponse.json({
      success: true,
      data: workshops,
      total: workshops.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, rejectMessage } = await request.json();

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { data: sessionData, error: sessionError } = await supabaseServer
      .from("admin_sessions")
      .select("admin_email, expires_at")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const adminEmail = sessionData.admin_email;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields: id and status" },
        { status: 400 }
      );
    }

    if (
      status === "Rejected" &&
      (!rejectMessage || rejectMessage.trim() === "")
    ) {
      return NextResponse.json(
        {
          error:
            "Reject message is required when rejecting a workshop registration",
        },
        { status: 400 }
      );
    }

    const { data: currentWorkshop, error: fetchError } = await supabaseServer
      .from("Workshop")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentWorkshop) {
      return NextResponse.json(
        { error: "Workshop registration not found" },
        { status: 404 }
      );
    }

    const oldStatus = currentWorkshop.approval;
    const updateData: Partial<WorkshopDB> = {
      approval: status,
    };

    const { data, error } = await supabaseServer
      .from("Workshop")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating workshop status:", error);
      return NextResponse.json(
        { error: "Failed to update workshop status" },
        { status: 500 }
      );
    }

    // Record admin action in history
    const action =
      status === "Approved"
        ? "approve"
        : status === "Rejected"
        ? "reject"
        : "reset";
    await HistoryService.recordAction(
      adminEmail,
      action,
      oldStatus,
      status,
      "workshop",
      id
    );

    const updatedWorkshop = convertWorkshopDBToWorkshop(data);

    let emailSent = false;
    try {
      if (status === "Approved") {
        await EmailService.sendWorkshopSuccessEmail(
          currentWorkshop.email,
          currentWorkshop.full_name,
          currentWorkshop.workshop,
          currentWorkshop.institution
        );
        console.log(`Workshop approval email sent to ${currentWorkshop.email}`);
        emailSent = true;
      } else if (status === "Rejected") {
        await EmailService.sendWorkshopRejectionEmail(
          currentWorkshop.email,
          currentWorkshop.full_name,
          currentWorkshop.workshop,
          currentWorkshop.institution,
          rejectMessage
        );
        console.log(
          `Workshop rejection email sent to ${currentWorkshop.email}`
        );
        emailSent = true;
      }
    } catch (emailError) {
      console.error("Failed to send workshop email:", emailError);
    }

    let notificationSent = false;
    try {
      notificationSent =
        await NotificationService.createWorkshopApprovalNotification(
          currentWorkshop.email,
          currentWorkshop.full_name,
          currentWorkshop.workshop,
          status === "Approved",
          rejectMessage
        );
    } catch (notificationError) {
      console.error(
        "Failed to create workshop notification:",
        notificationError
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkshop,
      emailSent,
      notificationSent,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
