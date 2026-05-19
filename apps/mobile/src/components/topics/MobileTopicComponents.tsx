import { Link } from "expo-router"
import { Linking, Pressable, Text, View } from "react-native"
import type {
  ResearchTopic,
  TopicAction,
  TopicModule,
  TopicSource,
} from "@/src/lib/topics"

export const themeClasses = {
  ethics: "border-red-200 bg-red-50",
  surveillance: "border-zinc-300 bg-zinc-950",
  infrastructure: "border-emerald-200 bg-emerald-50",
  future: "border-amber-200 bg-amber-50",
} as const

export const themeTextClasses = {
  ethics: "text-red-950",
  surveillance: "text-white",
  infrastructure: "text-emerald-950",
  future: "text-amber-950",
} as const

export const urgencyClasses = {
  low: "border-zinc-300 bg-zinc-100 text-zinc-800",
  medium: "border-amber-300 bg-amber-50 text-amber-900",
  high: "border-red-300 bg-red-50 text-red-900",
} as const

export const claimStatusClasses = {
  documented: "border-emerald-300 bg-emerald-50 text-emerald-900",
  contested: "border-amber-300 bg-amber-50 text-amber-900",
  unsupported: "border-red-300 bg-red-50 text-red-900",
  watch: "border-zinc-300 bg-zinc-100 text-zinc-800",
} as const

export function TopicCard({
  topic,
  compact = false,
}: {
  topic: ResearchTopic
  compact?: boolean
}) {
  return (
    <Link href={`/topics/${topic.slug}`} asChild>
      <Pressable className={`border p-5 ${themeClasses[topic.theme]}`}>
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text
              className={`text-xs font-bold tracking-[1.6px] uppercase ${
                themeTextClasses[topic.theme]
              }`}
            >
              Topic {topic.topicNumber} / {topic.region}
            </Text>
            <Text
              className={`mt-3 font-bold ${
                compact ? "text-2xl leading-7" : "text-3xl leading-9"
              } ${themeTextClasses[topic.theme]}`}
            >
              {topic.title}
            </Text>
          </View>
          <Text
            className={`border px-2 py-1 text-[10px] font-bold tracking-[1.2px] uppercase ${
              urgencyClasses[topic.statusBrief.urgency]
            }`}
          >
            {topic.statusBrief.urgency}
          </Text>
        </View>
        <Text
          className={`mt-4 text-sm leading-6 ${themeTextClasses[topic.theme]}`}
        >
          {compact ? topic.statusBrief.headline : topic.summary}
        </Text>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {topic.modules.slice(0, 3).map((module) => (
            <Text
              key={`${topic.slug}-${module.type}-${module.title}`}
              className={`border px-2 py-1 text-[10px] font-bold tracking-[1px] uppercase ${
                topic.theme === "surveillance"
                  ? "border-white/20 text-white"
                  : "border-zinc-300 text-zinc-700"
              }`}
            >
              {module.eyebrow}
            </Text>
          ))}
        </View>
      </Pressable>
    </Link>
  )
}

export function SourceList({
  indexes,
  sources,
}: {
  indexes?: Array<number>
  sources: Array<TopicSource>
}) {
  if (!indexes?.length) return null

  return (
    <View className="mt-4 gap-2">
      {indexes.map((index) => {
        const source = sources[index]
        if (!source) return null

        return (
          <Pressable
            key={`${source.url}-${index}`}
            className="border-l-2 border-zinc-950 pl-3"
            onPress={() => {
              void Linking.openURL(source.url)
            }}
          >
            <Text className="text-xs font-bold text-zinc-950">
              {source.publisher}, {source.year}
            </Text>
            <Text className="mt-1 text-xs leading-5 text-zinc-600">
              {source.title}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function ModuleHeader({
  module,
  summary,
}: {
  module: Pick<TopicModule, "title" | "eyebrow">
  summary?: string
}) {
  return (
    <View>
      <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
        {module.eyebrow}
      </Text>
      <Text className="mt-2 text-3xl leading-9 font-bold text-zinc-950">
        {module.title}
      </Text>
      {summary ? (
        <Text className="mt-3 text-sm leading-6 text-zinc-600">{summary}</Text>
      ) : null}
    </View>
  )
}

export function TopicModuleView({
  module,
  topic,
  index,
}: {
  module: TopicModule
  topic: ResearchTopic
  index: number
}) {
  const shell =
    index % 2 === 0
      ? "border-zinc-200 bg-white"
      : "border-zinc-200 bg-[#f7f4ee]"

  if (module.type === "briefing") {
    return (
      <View className={`border p-5 ${shell}`}>
        <ModuleHeader module={module} />
        <View className="mt-5 gap-4">
          {module.body.map((paragraph) => (
            <Text key={paragraph} className="text-base leading-7 text-zinc-700">
              {paragraph}
            </Text>
          ))}
          {module.bullets?.map((bullet) => (
            <Text
              key={bullet}
              className="border-l-2 border-zinc-950 bg-white px-4 py-3 text-sm leading-6 text-zinc-700"
            >
              {bullet}
            </Text>
          ))}
          <SourceList indexes={module.sourceIndexes} sources={topic.sources} />
        </View>
      </View>
    )
  }

  if (module.type === "statGrid") {
    return (
      <View className={`border p-5 ${shell}`}>
        <ModuleHeader module={module} />
        <View className="mt-5 gap-4">
          {module.stats.map((stat) => (
            <View
              key={stat.label}
              className="border border-zinc-200 bg-white p-5"
            >
              <Text className="text-4xl font-bold text-zinc-950">
                {stat.value}
              </Text>
              <Text className="mt-3 text-sm leading-6 text-zinc-700">
                {stat.label}
              </Text>
              <SourceList
                indexes={stat.sourceIndexes}
                sources={topic.sources}
              />
            </View>
          ))}
        </View>
      </View>
    )
  }

  if (module.type === "evidenceMatrix") {
    return (
      <View className={`border p-5 ${shell}`}>
        <ModuleHeader module={module} summary={module.summary} />
        <View className="mt-5 gap-4">
          {module.rows.map((row) => (
            <View
              key={row.label}
              className="border border-zinc-200 bg-white p-5"
            >
              <Text className="text-xl font-bold text-zinc-950">
                {row.label}
              </Text>
              <Text className="mt-4 text-xs font-bold tracking-[1.4px] text-emerald-800 uppercase">
                What We Know
              </Text>
              <Text className="mt-2 text-sm leading-6 text-zinc-700">
                {row.evidence}
              </Text>
              <Text className="mt-4 text-xs font-bold tracking-[1.4px] text-red-700 uppercase">
                What Is Still Unclear
              </Text>
              <Text className="mt-2 text-sm leading-6 text-zinc-700">
                {row.caveat}
              </Text>
              <SourceList indexes={row.sourceIndexes} sources={topic.sources} />
            </View>
          ))}
        </View>
      </View>
    )
  }

  if (module.type === "claimLedger") {
    return (
      <View className={`border p-5 ${shell}`}>
        <ModuleHeader module={module} />
        <View className="mt-5 gap-3">
          {module.rows.map((row) => (
            <View
              key={row.claim}
              className="border border-zinc-200 bg-white p-5"
            >
              <Text
                className={`self-start border px-3 py-1 text-[10px] font-bold tracking-[1.4px] uppercase ${
                  claimStatusClasses[row.status]
                }`}
              >
                {row.status}
              </Text>
              <Text className="mt-4 text-sm leading-6 font-semibold text-zinc-950">
                {row.claim}
              </Text>
              <Text className="mt-3 text-sm leading-6 text-zinc-700">
                {row.finding}
              </Text>
              <SourceList indexes={row.sourceIndexes} sources={topic.sources} />
            </View>
          ))}
        </View>
      </View>
    )
  }

  if (module.type === "tracker") {
    return (
      <View className={`border p-5 ${shell}`}>
        <ModuleHeader module={module} />
        <View className="mt-5 overflow-hidden border border-zinc-200 bg-white">
          {module.rows.map((row, rowIndex) => (
            <View
              key={`${row.cells.join("-")}-${rowIndex}`}
              className="border-b border-zinc-200 p-5 last:border-b-0"
            >
              {row.cells.map((cell, cellIndex) => (
                <View key={`${cell}-${cellIndex}`} className="mb-4 last:mb-0">
                  <Text className="text-[10px] font-bold tracking-[1.4px] text-zinc-500 uppercase">
                    {module.columns[cellIndex]}
                  </Text>
                  <Text className="mt-1 text-sm leading-6 text-zinc-700">
                    {cell}
                  </Text>
                </View>
              ))}
              <SourceList indexes={row.sourceIndexes} sources={topic.sources} />
            </View>
          ))}
        </View>
      </View>
    )
  }

  if (module.type === "moneyTrail") {
    return (
      <View className={`border p-5 ${shell}`}>
        <ModuleHeader module={module} />
        <View className="mt-5 gap-4">
          {module.rows.map((row) => (
            <View
              key={row.actor}
              className="border border-zinc-200 bg-white p-5"
            >
              <Text className="text-xs font-bold tracking-[1.6px] text-red-700 uppercase">
                {row.actor}
              </Text>
              <Text className="mt-4 text-xl font-bold text-zinc-950">
                {row.mechanism}
              </Text>
              <Text className="mt-3 text-sm leading-6 text-zinc-700">
                {row.impact}
              </Text>
              <SourceList indexes={row.sourceIndexes} sources={topic.sources} />
            </View>
          ))}
        </View>
      </View>
    )
  }

  if (module.type === "policyLevers") {
    return (
      <View className={`border p-5 ${shell}`}>
        <ModuleHeader module={module} />
        <View className="mt-5 gap-4">
          {module.levers.map((lever) => (
            <View
              key={`${lever.actor}-${lever.lever}`}
              className="border border-zinc-200 bg-white p-5"
            >
              <Text className="text-sm font-bold text-red-700">
                {lever.actor}
              </Text>
              <Text className="mt-3 text-base leading-6 font-semibold text-zinc-950">
                {lever.lever}
              </Text>
              <Text className="mt-3 text-sm leading-6 text-zinc-700">
                {lever.pressurePoint}
              </Text>
              <SourceList
                indexes={lever.sourceIndexes}
                sources={topic.sources}
              />
            </View>
          ))}
        </View>
      </View>
    )
  }

  if (module.type === "actionList") {
    return (
      <View className={`border p-5 ${shell}`}>
        <ModuleHeader module={module} />
        <View className="mt-5 gap-4">
          {module.actions.map((action, actionIndex) => (
            <ActionCard
              action={action}
              index={actionIndex}
              key={action.title}
            />
          ))}
        </View>
      </View>
    )
  }

  return (
    <View className={`border p-5 ${shell}`}>
      <ModuleHeader module={module} />
      <View className="mt-5 gap-4">
        {module.items.map((item) => (
          <View
            key={`${item.date}-${item.title}`}
            className="border border-zinc-200 bg-white p-5"
          >
            <Text className="text-sm font-bold tracking-[1.6px] text-red-700 uppercase">
              {item.date}
            </Text>
            <Text className="mt-3 text-xl font-bold text-zinc-950">
              {item.title}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-zinc-700">
              {item.description}
            </Text>
            <SourceList indexes={item.sourceIndexes} sources={topic.sources} />
          </View>
        ))}
      </View>
    </View>
  )
}

export function ActionCard({
  action,
  index,
}: {
  action: TopicAction
  index: number
}) {
  return (
    <View className="border border-zinc-200 bg-white p-5">
      <View className="flex-row flex-wrap items-center gap-3">
        <Text className="text-sm font-bold text-red-700">
          {(index + 1).toString().padStart(2, "0")}
        </Text>
        <Text
          className={`border px-3 py-1 text-[10px] font-bold tracking-[1.4px] uppercase ${
            urgencyClasses[action.urgency]
          }`}
        >
          {action.urgency}
        </Text>
        <Text className="text-[10px] font-bold tracking-[1.4px] text-zinc-500 uppercase">
          {action.audience} / {action.difficulty}
        </Text>
      </View>
      <Text className="mt-4 text-2xl font-bold text-zinc-950">
        {action.title}
      </Text>
      <Text className="mt-2 text-sm leading-6 text-zinc-700">
        {action.description}
      </Text>
      <Text className="mt-4 border-l-2 border-zinc-950 bg-[#f7f4ee] px-4 py-3 text-sm leading-6 text-zinc-700">
        {action.script}
      </Text>
      {action.ctaUrl ? (
        <Pressable
          className="mt-4 items-center border border-zinc-950 bg-zinc-950 px-4 py-3"
          onPress={() => {
            void Linking.openURL(action.ctaUrl!)
          }}
        >
          <Text className="text-xs font-bold tracking-[1.6px] text-white uppercase">
            {action.ctaLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}
