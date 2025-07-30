'use client'
import { Activity, Map as MapIcon, MessageCircle } from 'lucide-react'
import DottedMap from 'dotted-map'
import { Area, AreaChart, CartesianGrid } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export function InfrastructureBento() {
    return (
        <section className="px-4 ">
            <div className="mx-auto grid max-w-7xl border md:grid-cols-2">
                <div>
                    <div className="p-6 sm:p-12">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <MapIcon className="size-4" />
                            Network Layer
                        </span>

                        <p className="mt-8 text-2xl font-semibold">Value that multiplies with adoption. Cross-team intelligence sharing, collective learning algorithms, and platform ecosystem effects.</p>
                    </div>

                    <div aria-hidden className="relative">
                        <div className="absolute inset-0 z-10 m-auto size-fit">
                            <div className="rounded-[--radius] bg-background z-[1] dark:bg-muted relative flex size-fit w-fit items-center gap-2 border px-3 py-1 text-xs font-medium shadow-md shadow-black/5">
                                <span className="text-lg" role="img" aria-label="Canada flag">🇨🇦</span> Last connection from ChatPM
                            </div>
                            <div className="rounded-[--radius] bg-background absolute inset-2 -bottom-2 mx-auto border px-3 py-4 text-xs font-medium shadow-md shadow-black/5 dark:bg-zinc-900"></div>
                        </div>

                        <div className="relative overflow-hidden">
                            <div className="[background-image:radial-gradient(var(--tw-gradient-stops))] z-1 to-background absolute inset-0 from-transparent to-75%"></div>
                            <Map />
                        </div>
                    </div>
                </div>
                <div className="overflow-hidden border-t bg-zinc-50 p-6 sm:p-12 md:border-0 md:border-l dark:bg-transparent">
                    <div className="relative z-10">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <MessageCircle className="size-4" />
                            Cognitive Layer
                        </span>

                        <p className="my-8 text-2xl font-semibold">AI that thinks like your best team member. Context-aware decision engine with predictive workflow optimization and autonomous task orchestration.</p>
                    </div>
                    <div aria-hidden className="flex flex-col gap-8">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex justify-center items-center size-5 rounded-full border">
                                    <span className="size-3 rounded-full bg-primary"/>
                                </span>
                                <span className="text-muted-foreground text-xs">Wed 30 July</span>
                            </div>
                            <div className="rounded-[--radius] bg-background mt-1.5 w-3/5 border p-3 text-xs">Hey, what&apos;s in our marketing agenda today?</div>
                        </div>

                        <div>
                            <div className="rounded-[--radius] mb-1 ml-auto w-3/5 bg-blue-600 p-3 text-xs text-white">
                                Sure! Here’s today’s marketing agenda:
                                <ul className="list-disc pl-4 mt-2">
                                    <li>Review campaign performance</li>
                                    <li>Finalize new blog post</li>
                                    <li>Schedule social media updates</li>
                                    <li>Sync with design team at 2pm</li>
                                </ul>
                            </div>
                            <span className="text-muted-foreground block text-right text-xs">Now</span>
                        </div>
                    </div>
                </div>
                <div className="col-span-full border-y p-12">
                    <p className="text-center text-4xl font-semibold lg:text-7xl">99.99% Uptime</p>
                </div>
                <div className="relative col-span-full">
                    <div className="absolute z-10 max-w-lg px-6 pr-12 pt-6 md:px-12 md:pt-12">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Activity className="size-4" />
                            Scale Layer
                        </span>

                        <p className="my-8 text-2xl font-semibold">
                        Infrastructure that grows infinitely. <span className="text-muted-foreground"> Auto-scaling architecture with performance optimization AI for unlimited growth.</span>
                        </p>
                    </div>
                    <MonitoringChart />
                </div>
            </div>
        </section>
    )
}

const map = new DottedMap({ height: 55, grid: 'diagonal' })

const points = map.getPoints()

const svgOptions = {
    backgroundColor: 'var(--color-background)',
    color: 'currentColor',
    radius: 0.15,
}

const Map = () => {
    const viewBox = `0 0 120 60`
    return (
        <svg viewBox={viewBox} style={{ background: svgOptions.backgroundColor }}>
            {points.map((point, index) => (
                <circle key={index} cx={point.x} cy={point.y} r={svgOptions.radius} fill={svgOptions.color} />
            ))}
        </svg>
    )
}

// Replacing "desktop" and "mobile" with "API Requests" and "AI Tasks" for infrastructure monitoring context

const chartConfig = {
    apiRequests: {
        label: 'API Requests',
        color: '#2563eb',
    },
    aiTasks: {
        label: 'AI Tasks',
        color: '#60a5fa',
    },
} satisfies ChartConfig

const chartData = [
    { month: 'May', apiRequests: 56000, aiTasks: 224000 },
    { month: 'June', apiRequests: 58000, aiTasks: 240000 },
    { month: 'January', apiRequests: 126000, aiTasks: 252000 },
    { month: 'February', apiRequests: 205000, aiTasks: 410000 },
    { month: 'March', apiRequests: 200000, aiTasks: 126000 },
    { month: 'April', apiRequests: 400000, aiTasks: 800000 },
]

const MonitoringChart = () => {
    return (
        <ChartContainer className="h-120 aspect-auto md:h-96" config={chartConfig}>
            <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                    left: 0,
                    right: 0,
                }}>
                <defs>
                    <linearGradient id="fillApiRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-apiRequests)" stopOpacity={0.8} />
                        <stop offset="55%" stopColor="var(--color-apiRequests)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillAiTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-aiTasks)" stopOpacity={0.8} />
                        <stop offset="55%" stopColor="var(--color-aiTasks)" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <ChartTooltip active cursor={false} content={<ChartTooltipContent className="dark:bg-muted" />} />
                <Area strokeWidth={2} dataKey="aiTasks" type="stepBefore" fill="url(#fillAiTasks)" fillOpacity={0.1} stroke="var(--color-aiTasks)" stackId="a" />
                <Area strokeWidth={2} dataKey="apiRequests" type="stepBefore" fill="url(#fillApiRequests)" fillOpacity={0.1} stroke="var(--color-apiRequests)" stackId="a" />
            </AreaChart>
        </ChartContainer>
    )
}
