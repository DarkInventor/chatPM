"use client"
import { SidebarLeft } from "@/components/sidebar-left"
import { MainContent } from "@/components/main-content"
import { NavigationProvider } from "@/contexts/navigation-context"
import { RightSidebarProvider, useRightSidebar } from "@/contexts/right-sidebar-context"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { PanelRight, X } from "lucide-react"
import { SidebarRight } from "@/components/sidebar-right"
import { InvitationPopup } from "@/components/invitation-popup"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@radix-ui/react-separator"



function DashboardContent() {
  const { isOpen: isRightSidebarOpen, toggle: toggleRightSidebar } = useRightSidebar()

  return (
    // <SidebarProvider>
    //   <SidebarLeft />
      // <SidebarInset>
      //   <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2">
      //     <div className="flex flex-1 items-center gap-2 px-3">
      //       <SidebarTrigger />
      //       <Separator
      //         orientation="vertical"
      //         className="mr-2 data-[orientation=vertical]:h-4"
      //       />
      //       <Breadcrumb>
      //         <BreadcrumbList>
      //           <BreadcrumbItem>
      //             <BreadcrumbPage className="line-clamp-1">
      //               ChatPM
      //             </BreadcrumbPage>
      //           </BreadcrumbItem>
      //         </BreadcrumbList>
      //       </Breadcrumb>
      //     </div>
      //   </header>
      //   <div className="flex flex-1 flex-col gap-4 p-4">
      //     <div className="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl" />
      //     <div className="bg-muted/50 mx-auto h-[100vh] w-full max-w-3xl rounded-xl" />
      //   </div>
      // </SidebarInset>
    //   <SidebarRight />
    // </SidebarProvider>
    <NavigationProvider>
      <SidebarProvider defaultOpen={true}>
        <SidebarLeft />
        <SidebarInset>
        <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center justify-between gap-2 px-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      ChatPM
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 w-8 p-0"
              onClick={toggleRightSidebar}
            >
              {isRightSidebarOpen ? <PanelRight className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* <div className="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl" />
          <div className="bg-muted/50 mx-auto h-[100vh] w-full max-w-3xl rounded-xl" /> */}
            <MainContent />
        </div>
      </SidebarInset>
      
        {isRightSidebarOpen && <SidebarRight />}
        
        {/* Invitation Popup for pending invitations */}
        <InvitationPopup />
      </SidebarProvider>
    </NavigationProvider>
  )
}

export default function Page() {
  return (
    <RightSidebarProvider>
      <DashboardContent />
    </RightSidebarProvider>
  )
}
