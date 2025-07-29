"use client"

import * as React from "react"
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { X, FileText } from "react-feather";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar"

interface IndieHackSidebarRightProps extends React.ComponentProps<typeof Sidebar> {
  rightPanelOpen?: boolean;
  setRightPanelOpen?: (open: boolean) => void;
}

export function IndieHackSidebarRight({
  rightPanelOpen = true,
  setRightPanelOpen,
  ...props
}: IndieHackSidebarRightProps) {
  return (
    <Sidebar
      collapsible="none"
      className={`
        ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'} 
        lg:translate-x-0 fixed lg:static inset-y-0 right-0 z-50
        sticky top-0 hidden h-svh border-l lg:flex
        transition-transform duration-300 ease-in-out
      `}
      {...props}
    >
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <div className="flex items-center justify-between px-4">
          <div>
            <h3 className="font-semibold text-gray-800">Project Details</h3>
            <p className="text-sm text-gray-500">Mobile App Launch</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setRightPanelOpen?.(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4 space-y-6 overflow-y-auto">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Description</h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            Launch a new mobile application for iOS and Android to expand our market reach and provide a better user experience on the go.
          </p>
        </div>
        
        <SidebarSeparator />
        
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Members (3)</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1oO7r4Ht2g8GXtjPXNjZEwaCvZksSCCE8gPX4qKg1FsrInRHmYiePnEyECKXsOv0q8WrSmc58uB3BoxhESrJZpqnd1nC4amTt45c_wIBvn_Op4vXLJLLt5XFVbEZ4DWfUqmCTG4PlDSmkOp3LFMCS5U3i-Iw2Fj-Mm2mbrUX7DLyU48DzTWpcI17zJEFTQ6vfFKuHX6bvxgmOHYKDDp01Ld5sKarm4cezl1dp0Tu5OPKFpNIz0nNC-fJIRSaoIUv0lZzSis5qUlAh" />
                <AvatarFallback>SS</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700 font-medium">Sam Smith (You)</span>
            </div>
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfLB7Qxy6NeGFc5t_ugQDbOciJt4sqFnH_4o0bn8LYbnVIE86-M0Bdc_JtOi5OBUZ_OxHt8Y9QxMh5UPdUuJq0qmEJlJj_Tp97uEuHp9WXvdJlBJrDuiBZYGXqITnhJqj_3-n3zbpyot8LYMsKVwYyRZaWgbIrBdkEh5HtZ2RH1_hljLu7VHBu5QSFB_UCq9mxCegxgkH4eupkqwdky5X8pn-tDzeaUaqwYwvQ6A3i0SZNCE208O9jigTvfoLBkDd3XRPhOElJ729B" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700 font-medium">Jane Doe</span>
            </div>
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmz99_DlwPTYI7jbiGWdJ5ylNJobmz1c4_4eCYbXWrtWsWS2sGtBq5n74g9_VlU9PoWuIUvH1flQBdqCqluB-dTVqPo-PW3kRjfFFFIO5GQLSP0UiKSjjRzqNVonDCw0taB98TIz1PNcjD59TxTLFAjXeonhVIX4SKdvVTSEvka-flLOl97hmrlsWvarSfr37YPzNhGFqBo4-gwUgyd_CwvXm4Rm_d4ei1godXIu-8TYwhTF_8zSJ7Dm6mljsk-efyhtf2OgYbzHr7" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700 font-medium">John Smith</span>
            </div>
          </div>
        </div>
        
        <SidebarSeparator />
        
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pinned Items</h4>
          <div className="space-y-2">
            <Card className="p-3 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-start space-x-3">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-800">Project Brief</p>
                  <p className="text-xs text-gray-500">Added by Sam Smith</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-start space-x-3">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-800">Design Mockups</p>
                  <p className="text-xs text-gray-500">Added by Jane Doe</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        <SidebarSeparator />
        
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Files</h4>
          <div className="space-y-2">
            <Card className="p-3 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-red-500" />
                <span className="text-sm text-gray-700 font-medium">Launch_Plan_v1.pdf</span>
              </div>
            </Card>
            <Card className="p-3 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                  <span className="text-xs text-white font-bold">F</span>
                </div>
                <span className="text-sm text-gray-700 font-medium">App_Mockups.fig</span>
              </div>
            </Card>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}