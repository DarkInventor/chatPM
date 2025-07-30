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

        <div className="mb-10 mt-4  md:mt-6">
          <div className="px-2">
            <div className="border-ali relative mx-auto h-full max-w-7xl border p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:px-12 md:py-20">
              <h1 className="flex  select-none flex-col  px-3 py-2 text-center text-5xl font-semibold leading-none tracking-tight md:flex-col md:text-8xl lg:flex-row lg:text-8xl">
                <DIcons.Plus
                  strokeWidth={4}
                  className="text-ali absolute -left-5 -top-5 h-10 w-10"
                />
                <DIcons.Plus
                  strokeWidth={4}
                  className="text-ali absolute -bottom-5 -left-5 h-10 w-10"
                />
                <DIcons.Plus
                  strokeWidth={4}
                  className="text-ali absolute -right-5 -top-5 h-10 w-10"
                />
                <DIcons.Plus
                  strokeWidth={4}
                  className="text-ali absolute -bottom-5 -right-5 h-10 w-10"
                />
                 Join the AI Workplace Revolution
              </h1>
              <div className="flex items-center justify-center gap-1">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                <p className="text-xs text-green-500">Available Now</p>
              </div>
            </div>
          </div>

          <h1 className="mt-8 text-2xl md:text-2xl max-w-3xl flex align-center justify-center mx-auto">
          Every day you wait, your competitors get further ahead. The infrastructure is ready. The future is here. The only question is whether you'll lead or follow.{" "}
            {/* <span className="text-ali font-bold">Ali </span> */}
          </h1>

          {/* <p className="md:text-md mx-auto mb-16 mt-2 max-w-2xl px-6 text-sm text-primary/60 sm:px-6 md:max-w-4xl md:px-20 lg:text-lg">
            I craft enchanting visuals for brands, and conjure design resources
            to empower others.
          </p> */}
          <div className="flex justify-center gap-2 mt-6">
            <Link href={"/dashboard"}>
              <Button variant="default" size="lg">
              Claim Your Spot in the Future
              <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={"https://cal.com/aliimam/designali"} target="_blank">
              <Button variant="outline" size="lg">
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

 
