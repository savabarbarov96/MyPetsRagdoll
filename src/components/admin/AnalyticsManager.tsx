import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Calendar, Monitor, Smartphone, Tablet } from 'lucide-react';
import {
  useAnalyticsSummary,
  useDailyStats,
  usePageStats,
  useDeviceStats,
  formatShortDate,
  getDeviceLabel,
  getPageLabel,
} from '@/services/convexAnalyticsService';

const AnalyticsManager = () => {
  const summary = useAnalyticsSummary();
  const dailyStats = useDailyStats(30);
  const pageStats = usePageStats();
  const deviceStats = useDeviceStats();

  if (!summary || !dailyStats || !pageStats || !deviceStats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Зареждане на аналитика...</p>
        </div>
      </div>
    );
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Tablet className="h-5 w-5" />;
      case 'desktop': return <Monitor className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div>
          <h2 className="font-playfair text-2xl font-semibold text-gray-900">Аналитика на посетители</h2>
          <p className="text-sm text-gray-600 mt-1">Преглед на посещенията на сайта</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Today */}
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Днес
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summary.today.total}</div>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Реални: {summary.today.real}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  +{summary.today.synthetic}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Last 7 Days */}
          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Последни 7 дни
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summary.last7Days.total}</div>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Реални: {summary.last7Days.real}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  +{summary.last7Days.synthetic}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Last 30 Days */}
          <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Последни 30 дни
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summary.last30Days.total}</div>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Реални: {summary.last30Days.real}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  +{summary.last30Days.synthetic}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* All Time */}
          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Всички посетители
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summary.allTime.total}</div>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Реални: {summary.allTime.real}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  +{summary.allTime.synthetic}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Stats Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Дневна статистика (30 дни)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Дата</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Реални</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Синтетични</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Всичко</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Прегледи</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.map((stat) => (
                      <tr key={stat.date} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900">{formatShortDate(stat.date)}</td>
                        <td className="py-3 px-4 text-sm text-right">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {stat.real}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {stat.synthetic}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-right text-gray-900">
                          {stat.total}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-600">
                          {stat.pageViews}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Устройства</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deviceStats.map((stat) => (
                    <div key={stat.device} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(stat.device)}
                        <span className="text-sm text-gray-700">{getDeviceLabel(stat.device)}</span>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {stat.count}
                      </Badge>
                    </div>
                  ))}
                  {deviceStats.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Няма данни</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Топ страници</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pageStats.slice(0, 10).map((stat) => (
                    <div key={stat.path} className="border-b pb-2 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {getPageLabel(stat.path)}
                        </span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {stat.uniqueVisitors}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {stat.path} • {stat.views} прегледи
                      </div>
                    </div>
                  ))}
                  {pageStats.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Няма данни</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsManager;
