"use client";

import { useEffect } from "react";
import Link from "next/link";
import { renderCanvas } from "@/components/ui/canvas"
import { ArrowRight, DIcons, Play } from "dicons";

import { Button } from "@/components/ui/button";

export function CTA() {

  return (
    <section id="home">
      <div className="animation-delay-8 animate-fadeIn mt-0 flex  flex-col items-center justify-center px-4 text-center md:mt-0 ">
        <div className="z-10 mb-6 mt-10 sm:justify-center md:mb-4 md:mt-20">
          <div className="relative flex items-center whitespace-nowrap rounded-full border bg-popover px-3 py-1 text-xs leading-6  text-primary/60 ">
            <DIcons.Shapes className="h-5 p-1" />  Join the AI Workplace Revolution
            <a
              href="/products/dicons"
              rel="noreferrer"
              className="hover:text-ali ml-1 flex items-center font-semibold"
            >
              <div className="absolute inset-0 flex" aria-hidden="true" />
              Explore{" "}
              <span aria-hidden="true">
                <DIcons.ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        </div>

        <div className="mb-10 mt-4 md:mt-6 max-w-7xl px-2 sm:px-6 lg:px-12 w-full">
          <div className="px-0 sm:px-2">
            <div className="border-ali relative mx-auto h-full w-full max-w-7xl border p-4 sm:p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:px-12 md:py-20">
              <h1 className="flex select-none flex-col px-1 sm:px-3 py-2 text-center text-3xl xs:text-4xl sm:text-5xl md:text-8xl font-semibold leading-none tracking-tight md:flex-col lg:flex-row">
                <DIcons.Plus
                  strokeWidth={4}
                  className="text-ali absolute -left-2 -top-2 h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10"
                />
                <DIcons.Plus
                  strokeWidth={4}
                  className="text-ali absolute -bottom-2 -left-2 h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10"
                />
                <DIcons.Plus
                  strokeWidth={4}
                  className="text-ali absolute -right-2 -top-2 h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10"
                />
                <DIcons.Plus
                  strokeWidth={4}
                  className="text-ali absolute -bottom-2 -right-2 h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10"
                />
                <span className="break-words">Join the AI Workplace Revolution</span>
              </h1>
              <div className="flex flex-col xs:flex-row items-center justify-center gap-1 mt-2">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                <p className="text-xs text-green-500">Available Now</p>
              </div>
            </div>
          </div>

          <h1 className="mt-6 sm:mt-8 text-base xs:text-lg sm:text-2xl max-w-xs xs:max-w-xl sm:max-w-3xl flex items-center justify-center mx-auto text-center px-2">
            Every day you wait, your competitors get further ahead. The infrastructure is ready. The future is here. The only question is whether you'll lead or follow.
          </h1>

          <div className="flex flex-col xs:flex-row justify-center gap-2 mt-6 w-full px-2">
            <Link href={"/dashboard"} className="w-full xs:w-auto">
              <Button variant="default" size="lg" className="w-full xs:w-auto">
                Claim Your Spot in the Future
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={"https://cal.com/aliimam/designali"} target="_blank" className="w-full xs:w-auto">
              <Button variant="outline" size="lg" className="w-full xs:w-auto">
                <Play className="h-4 w-4" />
                See What&apos;s Already Possible
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {/* <canvas
        className="bg-skin-base pointer-events-none absolute inset-0 mx-auto"
        id="canvas"
      ></canvas> */}
    </section>
  );
};

 
