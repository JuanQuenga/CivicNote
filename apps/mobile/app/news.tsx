import { useState } from 'react'
import { useQuery } from 'convex/react'
import { Image } from 'expo-image'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  AlertTriangle,
  ExternalLink,
  Globe,
  Heart,
  HeartPulse,
  MessageCircle,
  Newspaper,
  Phone,
  Scale,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { formatTimeAgo } from '../src/lib/format'

type NewsTab = 'feed' | 'health' | 'safety' | 'crisis'

type Article = {
  _id: string
  title: string
  description?: string
  url: string
  imageUrl?: string
  source: string
  publishedAt: number
}

type Resource = {
  name: string
  description: string
  url: string
  phone?: string
  textLine?: string
}

type ResourceSection = {
  title: string
  icon: React.ComponentType<{ color: string; size: number }>
  color: string
  resources: Array<Resource>
}

const TABS: Array<{
  value: NewsTab
  label: string
  icon: React.ComponentType<{ color: string; size: number }>
}> = [
  { value: 'feed', label: 'News Feed', icon: Newspaper },
  { value: 'health', label: 'Health', icon: Heart },
  { value: 'safety', label: 'Safety', icon: Shield },
  { value: 'crisis', label: 'Crisis Help', icon: AlertTriangle },
]

const HEALTH_SECTIONS: Array<ResourceSection> = [
  {
    title: 'HIV/PrEP Resources',
    icon: Shield,
    color: '#60a5fa',
    resources: [
      {
        name: 'HIV.gov',
        description:
          'HIV information, testing locations, and prevention resources.',
        url: 'https://www.hiv.gov',
      },
      {
        name: 'CDC PrEP Information',
        description: 'Learn about PrEP eligibility and how to get started.',
        url: 'https://www.cdc.gov/hiv/risk/prep/index.html',
      },
      {
        name: 'HIV Testing Locator',
        description: 'Find free, fast, and confidential HIV testing near you.',
        url: 'https://gettested.cdc.gov',
      },
    ],
  },
  {
    title: 'Mental Health',
    icon: HeartPulse,
    color: '#f472b6',
    resources: [
      {
        name: 'SAMHSA National Helpline',
        description:
          'Free, confidential 24/7 treatment referral and information service.',
        url: 'https://www.samhsa.gov/find-help/national-helpline',
        phone: '1-800-662-4357',
      },
      {
        name: 'Psychology Today LGBTQ+ Therapists',
        description: 'Find LGBTQ+-affirming therapists and support groups.',
        url: 'https://www.psychologytoday.com/us/therapists/lgbtq',
      },
    ],
  },
  {
    title: 'Sexual Health & Testing',
    icon: Heart,
    color: '#f87171',
    resources: [
      {
        name: 'CDC STI Testing Locator',
        description: 'Find STI testing clinics near you.',
        url: 'https://gettested.cdc.gov',
      },
      {
        name: 'Planned Parenthood',
        description: 'Affordable sexual health and LGBTQ+ healthcare.',
        url: 'https://www.plannedparenthood.org',
      },
    ],
  },
]

const SAFETY_SECTIONS: Array<ResourceSection> = [
  {
    title: 'Know Your Rights',
    icon: Scale,
    color: '#fbbf24',
    resources: [
      {
        name: 'Lambda Legal',
        description: 'Legal help and advocacy for LGBTQ+ people.',
        url: 'https://lambdalegal.org',
      },
      {
        name: 'HRC State Maps',
        description: 'State-by-state LGBTQ+ rights guide.',
        url: 'https://www.hrc.org/resources/state-maps',
      },
      {
        name: 'ACLU LGBTQ Rights',
        description: 'Legal resources and advocacy for equality.',
        url: 'https://www.aclu.org/issues/lgbtq-rights',
      },
    ],
  },
  {
    title: 'Report Hate Crimes',
    icon: ShieldAlert,
    color: '#f87171',
    resources: [
      {
        name: 'FBI Hate Crime Reporting',
        description: 'Report hate crimes to the FBI.',
        url: 'https://www.fbi.gov/how-can-we-help-you/submit-a-tip',
      },
      {
        name: 'NCAVP Anti-Violence Project',
        description: 'Crisis support for LGBTQ+ survivors.',
        url: 'https://avp.org',
      },
    ],
  },
  {
    title: 'Travel Safety',
    icon: Globe,
    color: '#60a5fa',
    resources: [
      {
        name: 'Equaldex',
        description: 'Interactive map of LGBTQ+ rights by country.',
        url: 'https://www.equaldex.com',
      },
      {
        name: 'U.S. State Department LGBTQI+ Travel',
        description: 'Travel advisories and safety tips.',
        url: 'https://travel.state.gov/content/travel/en/international-travel/before-you-go/travelers-with-special-considerations/lgbtqi.html',
      },
    ],
  },
]

const HOTLINES: Array<Resource & { hours: string; serves: string }> = [
  {
    name: 'Trevor Project',
    description: 'Crisis intervention for LGBTQ+ young people ages 13-24.',
    phone: '1-866-488-7386',
    textLine: 'Text START to 678-678',
    hours: '24/7',
    serves: 'LGBTQ+ Youth',
    url: 'https://www.thetrevorproject.org',
  },
  {
    name: '988 Suicide & Crisis Lifeline',
    description: 'Free, confidential crisis support.',
    phone: '988',
    textLine: 'Text 988',
    hours: '24/7',
    serves: 'Everyone',
    url: 'https://988lifeline.org',
  },
  {
    name: 'Trans Lifeline',
    description: 'Peer support hotline run by and for trans people.',
    phone: '1-877-565-8860',
    hours: '24/7',
    serves: 'Trans & non-binary people',
    url: 'https://translifeline.org',
  },
  {
    name: 'Crisis Text Line',
    description: 'Free 24/7 text-based crisis support.',
    textLine: 'Text HOME to 741741',
    hours: '24/7',
    serves: 'Everyone',
    url: 'https://www.crisistextline.org',
  },
]

function openUrl(url: string) {
  void Linking.openURL(url)
}

export default function NewsScreen() {
  const [activeTab, setActiveTab] = useState<NewsTab>('feed')
  const [selectedSource, setSelectedSource] = useState<string | undefined>()

  const articles = useQuery(api.news.getLatestArticles, {
    source: selectedSource,
    limit: 50,
  }) as Array<Article> | undefined
  const sources = useQuery(api.news.getArticleSources, {})
  const allSources = ['All', ...(sources ?? [])]

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <View className="border-b border-border bg-background px-4 py-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.value
                return (
                  <Pressable
                    key={tab.value}
                    className={`flex-row items-center gap-2 rounded-full border px-4 py-2 ${
                      isActive
                        ? 'border-primary bg-primary'
                        : 'border-border bg-card'
                    }`}
                    onPress={() => setActiveTab(tab.value)}
                  >
                    <Icon color={isActive ? '#FAFAFA' : '#999999'} size={16} />
                    <Text
                      className={`text-sm font-semibold ${
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        </View>

        <View className="px-4 py-5">
          {activeTab === 'feed' ? (
            <NewsFeed
              articles={articles}
              sources={allSources}
              selectedSource={selectedSource}
              onSourceChange={setSelectedSource}
            />
          ) : null}
          {activeTab === 'health' ? (
            <ResourceSections sections={HEALTH_SECTIONS} />
          ) : null}
          {activeTab === 'safety' ? (
            <ResourceSections sections={SAFETY_SECTIONS} />
          ) : null}
          {activeTab === 'crisis' ? <CrisisResources /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function NewsFeed({
  articles,
  sources,
  selectedSource,
  onSourceChange,
}: {
  articles?: Array<Article>
  sources: Array<string>
  selectedSource?: string
  onSourceChange: (source?: string) => void
}) {
  if (articles === undefined) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator color="#F11A23" />
      </View>
    )
  }

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {sources.map((source) => {
            const isActive =
              source === 'All' ? !selectedSource : selectedSource === source
            return (
              <Pressable
                key={source}
                className={`rounded-full border px-3 py-1.5 ${
                  isActive
                    ? 'border-primary bg-primary'
                    : 'border-border bg-card'
                }`}
                onPress={() =>
                  onSourceChange(source === 'All' ? undefined : source)
                }
              >
                <Text
                  className={`text-sm font-semibold ${
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {source}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>

      {articles.length === 0 ? (
        <View className="mt-8 items-center rounded-2xl border border-border bg-card p-6">
          <Newspaper color="#999999" size={32} />
          <Text className="mt-3 text-base font-semibold text-foreground">
            No articles yet
          </Text>
          <Text className="mt-1 text-center text-sm text-muted-foreground">
            LGBTQ+ news articles will appear here once fetched.
          </Text>
        </View>
      ) : (
        <View className="mt-4 gap-3">
          {articles.map((article) => (
            <Pressable
              key={article._id}
              className="flex-row gap-3 rounded-2xl border border-border bg-card p-3"
              onPress={() => openUrl(article.url)}
            >
              <View className="h-20 w-20 overflow-hidden rounded-xl bg-muted">
                {article.imageUrl ? (
                  <Image
                    source={{ uri: article.imageUrl }}
                    contentFit="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Newspaper color="#999999" size={24} />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {article.source}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {formatTimeAgo(article.publishedAt)}
                  </Text>
                </View>
                <Text
                  className="mt-2 text-sm font-semibold text-foreground"
                  numberOfLines={2}
                >
                  {article.title}
                </Text>
                {article.description ? (
                  <Text
                    className="mt-1 text-xs text-muted-foreground"
                    numberOfLines={2}
                  >
                    {article.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

function ResourceSections({ sections }: { sections: Array<ResourceSection> }) {
  return (
    <View className="gap-6">
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <View key={section.title}>
            <View className="mb-3 flex-row items-center gap-2">
              <Icon color={section.color} size={20} />
              <Text className="text-lg font-bold text-foreground">
                {section.title}
              </Text>
            </View>
            <View className="gap-2">
              {section.resources.map((resource) => (
                <ResourceCard key={resource.name} resource={resource} />
              ))}
            </View>
          </View>
        )
      })}
    </View>
  )
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Pressable
      className="rounded-2xl border border-border bg-card p-4"
      onPress={() => openUrl(resource.url)}
    >
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {resource.name}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-muted-foreground">
            {resource.description}
          </Text>
        </View>
        <ExternalLink color="#999999" size={17} />
      </View>
    </Pressable>
  )
}

function CrisisResources() {
  return (
    <View className="gap-3">
      <View className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
        <View className="flex-row gap-3">
          <AlertTriangle color="#f87171" size={22} />
          <View className="flex-1">
            <Text className="text-base font-bold text-red-400">
              In immediate danger? Call 911
            </Text>
            <Text className="mt-1 text-sm leading-5 text-red-300/80">
              The resources below provide specialized LGBTQ+ crisis support.
            </Text>
          </View>
        </View>
      </View>

      {HOTLINES.map((hotline) => (
        <View
          key={hotline.name}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                {hotline.name}
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                {hotline.serves}
              </Text>
            </View>
            <Text className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-500">
              {hotline.hours}
            </Text>
          </View>
          <Text className="mt-3 text-sm leading-5 text-muted-foreground">
            {hotline.description}
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {hotline.phone ? (
              <Pressable
                className="flex-row items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2"
                onPress={() =>
                  openUrl(`tel:${hotline.phone?.replace(/[^0-9+]/g, '')}`)
                }
              >
                <Phone color="#F11A23" size={15} />
                <Text className="text-sm font-semibold text-primary">
                  {hotline.phone}
                </Text>
              </Pressable>
            ) : null}
            {hotline.textLine ? (
              <View className="flex-row items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-2">
                <MessageCircle color="#60a5fa" size={15} />
                <Text className="text-sm font-semibold text-blue-400">
                  {hotline.textLine}
                </Text>
              </View>
            ) : null}
            <Pressable
              className="flex-row items-center gap-1.5 rounded-lg bg-muted px-3 py-2"
              onPress={() => openUrl(hotline.url)}
            >
              <ExternalLink color="#999999" size={14} />
              <Text className="text-sm font-semibold text-muted-foreground">
                Website
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  )
}
