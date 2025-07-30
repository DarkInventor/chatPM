import { Cpu, Lock, Sparkles, Zap } from 'lucide-react'

export function Features() {
    return (
        <section className="py-16 md:py-16">
            <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
                <div className="relative z-10 grid items-center gap-4 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-semibold">  The <span className="text-primary">$2.3 Trillion</span> Problem Everyone Ignores</h2>
                    <p className="max-w-sm sm:ml-auto text-muted-foreground text-xl">
                        While companies spend billions on productivity tools, 73% of knowledge workers still waste 21 hours per week on inefficient processes. The problem isn&apos;t more tools—it&apos;s the absence of intelligent infrastructure.
                        <br />
                        <span className="block mt-8 text-lg text-foreground font-medium">
                            Traditional project management treats symptoms. ChatPM eliminates the disease.
                        </span>
                    </p>
              
                   
                </div>
                <div className="relative rounded-3xl p-3 md:-mx-8 lg:col-span-3">
                    <div className="aspect-[88/36] relative">
                        <div className="bg-gradient-to-t z-1 from-background absolute inset-0 to-transparent"></div>
                        <img src="https://tailark.com/_next/image?url=%2Fmail-upper.png&w=3840&q=75" className="absolute inset-0 z-10" alt="payments illustration dark" width={2797} height={1137} />
                        <img src="https://tailark.com/_next/image?url=%2Fmail-back.png&w=3840&q=75" className="hidden dark:block" alt="payments illustration dark" width={2797} height={1137} />
                        <img src="/hero-image.png" className="dark:hidden" alt="payments illustration light" width={2797} height={1137} />
                    </div>
                </div>
                <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
                    <div className="space-y-3 border-r border-gray-200 pr-4">
                        <div className="flex items-center gap-2">
                            {/* <Zap className="size-5 font-extrabold text-red-500" /> */}
                            <h3 className="text-2xl font-extrabold text-red-500">73%</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Workers waste 21+ hours weekly</p>
                    </div>
                    <div className="space-y-2 border-r border-gray-200 pr-4">
                        <div className="flex items-center gap-2">
                            {/* <Cpu className="size-4" /> */}
                            <h3 className="text-2xl font-extrabold text-red-500">$2.3T</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Lost productivity annually</p>
                    </div>
                    <div className="space-y-2 border-r border-gray-200 pr-4">
                        <div className="flex items-center gap-2">
                            {/* <Lock className="size-4" /> */}
                            <h3 className="text-2xl font-extrabold text-primary">40%</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Efficiency gained with AI</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {/* <Sparkles className="size-4" /> */}

                            <h3 className="text-2xl font-extrabold text-primary">10M+</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Workers ready for AI</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
