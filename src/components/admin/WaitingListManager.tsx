import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type Status = 'new' | 'contacted' | 'closed';
const statuses: { value: Status; label: string }[] = [{ value: 'new', label: 'Нова' }, { value: 'contacted', label: 'Свързали сме се' }, { value: 'closed', label: 'Приключена' }];
const date = (timestamp: number) => new Date(timestamp).toLocaleString('bg-BG');

function WaitingListEditor({ record, sessionId, onBack }: { record: Doc<'waitingListSubmissions'>; sessionId: string; onBack: () => void }) {
  const update = useMutation(api.waitingList.update);
  const remove = useMutation(api.waitingList.remove);
  const [status, setStatus] = useState<Status>(record.status);
  const [notes, setNotes] = useState(record.notes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  async function save() {
    setError(''); setSaved(false); setBusy(true);
    try { await update({ sessionId, id: record._id, status, notes }); setNotes(notes.trim()); setSaved(true); }
    catch { setError('Промените не бяха записани. Данните във формата са запазени; опитайте отново.'); }
    finally { setBusy(false); }
  }
  async function deleteRecord() {
    setError(''); setBusy(true);
    try { await remove({ sessionId, id: record._id }); setConfirmDelete(false); onBack(); }
    catch { setError('Заявката не беше изтрита. Опитайте отново.'); }
    finally { setBusy(false); }
  }
  return <Card>
    <CardHeader><Button variant="outline" onClick={onBack} className="mb-4 w-fit" disabled={busy}>← Към списъка</Button><CardTitle>Заявка: {record.name || record.email || record.phone}</CardTitle></CardHeader>
    <CardContent className="space-y-6">
      <dl className="grid gap-5 text-sm sm:grid-cols-2">
        <div><dt className="font-semibold">Имейл</dt><dd className="break-all">{record.email ? <a className="underline" href={`mailto:${record.email}`}>{record.email}</a> : 'Не е посочен'}</dd></div>
        <div><dt className="font-semibold">Телефон</dt><dd>{record.phone ? <a className="underline" href={`tel:${record.phone}`}>{record.phone}</a> : 'Не е посочен'}</dd></div>
        <div><dt className="font-semibold">Получена</dt><dd>{date(record._creationTime)}</dd></div>
        <div><dt className="font-semibold">Разрешение за личен контакт</dt><dd>{record.followUpConsent ? 'Дадено изрично' : 'Липсва'} · {date(record.consentedAt)}<br />Версия: {record.noticeVersion}</dd></div>
        <div className="sm:col-span-2"><dt className="font-semibold">Предпочитания</dt><dd className="mt-1 whitespace-pre-wrap break-words">{record.preferences || 'Не са посочени'}</dd></div>
        {record.context && <div className="sm:col-span-2"><dt className="font-semibold">Контекст на запитването</dt><dd className="break-words">{record.context.label}<br /><a className="underline" href={record.context.url} target="_blank" rel="noopener noreferrer">{record.context.url}</a></dd></div>}
      </dl>
      <label className="block space-y-2"><span className="text-sm font-semibold">Статус</span><select aria-label="Статус на заявката" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(event) => { setStatus(event.target.value as Status); setSaved(false); }}>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="block space-y-2"><span className="text-sm font-semibold">Вътрешни бележки</span><Textarea rows={6} maxLength={5000} value={notes} onChange={(event) => { setNotes(event.target.value); setSaved(false); }} placeholder="Бележки за екипа — не се показват публично" /><span className="text-xs text-muted-foreground">{notes.length} / 5000 · Не въвеждайте ненужни чувствителни данни.</span></label>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}{saved && <p className="text-sm" role="status">Промените са записани.</p>}
      <div className="flex flex-wrap gap-3"><Button onClick={save} disabled={busy}>{busy ? 'Обработка…' : 'Запази промените'}</Button><Button variant="destructive" onClick={() => setConfirmDelete(true)} disabled={busy}>Изтрий заявката</Button></div>
      <AlertDialog open={confirmDelete} onOpenChange={(open) => { if (!busy) setConfirmDelete(open); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Да изтрием ли заявката?</AlertDialogTitle><AlertDialogDescription>Контактът {record.email || record.phone}, предпочитанията и вътрешните бележки ще бъдат изтрити от списъка. Действието не може да бъде отменено.</AlertDialogDescription></AlertDialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Отказ</AlertDialogCancel><Button variant="destructive" onClick={deleteRecord} disabled={busy}>{busy ? 'Изтриване…' : 'Потвърди изтриването'}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </CardContent>
  </Card>;
}

export default function WaitingListManager() {
  const { sessionId, isAuthenticated, isLoading } = useAdminAuth();
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [cursor, setCursor] = useState<string | null>(null);
  const [previousCursors, setPreviousCursors] = useState<(string | null)[]>([]);
  const [selected, setSelected] = useState<Doc<'waitingListSubmissions'> | null>(null);
  const [search, setSearch] = useState('');
  const result = useQuery(api.waitingList.list, sessionId && isAuthenticated ? { sessionId, ...(filter === 'all' ? {} : { status: filter }), paginationOpts: { numItems: 20, cursor } } : 'skip');
  function resetPage() { setCursor(null); setPreviousCursors([]); }
  if (isLoading) return <p role="status">Проверка на достъпа…</p>;
  if (!sessionId || !isAuthenticated) return <p>Влезте с удостоверена администраторска сесия, за да управлявате списъка.</p>;
  if (selected) return <WaitingListEditor key={selected._id} record={selected} sessionId={sessionId} onBack={() => { setSelected(null); resetPage(); }} />;
  const normalizedSearch = search.trim().toLowerCase();
  const records = result?.page.filter((record) => !normalizedSearch || [record.name, record.email, record.phone, record.preferences].some((value) => value?.toLowerCase().includes(normalizedSearch)));
  return <Card>
    <CardHeader><CardTitle>Списък за котенца</CardTitle><p className="text-sm text-muted-foreground">Личен контакт по заявка. Не е маркетингов абонамент и не изпраща автоматични съобщения.</p></CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold">Филтър по статус</span><select aria-label="Филтър по статус" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={filter} onChange={(event) => { setFilter(event.target.value as Status | 'all'); resetPage(); }}><option value="all">Всички</option>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="space-y-2"><span className="text-sm font-semibold">Търсене в текущата страница</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Име, имейл, телефон или предпочитания" /></label></div>
      {!result ? <p role="status">Зареждане на заявките…</p> : records?.length ? <div className="space-y-3">{records.map((record) => <article key={record._id} className="flex min-w-0 flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="font-semibold">{record.name || 'Без посочено име'}</h3><p className="mt-1 break-all text-sm">{record.email}{record.email && record.phone ? ' · ' : ''}{record.phone}</p><p className="mt-2 text-xs text-muted-foreground">{date(record._creationTime)} · {statuses.find((item) => item.value === record.status)?.label}</p>{record.context?.label && <p className="mt-2 text-sm">Относно: {record.context.label}</p>}</div><Button variant="outline" className="shrink-0" onClick={() => setSelected(record)}>Преглед и управление</Button></article>)}</div> : <p className="rounded-lg bg-muted p-5">{normalizedSearch ? 'Няма съвпадения в текущата страница. Изчистете търсенето или прегледайте друга страница.' : 'Няма заявки за избрания статус на тази страница.'}</p>}
      <nav className="flex flex-wrap items-center gap-3" aria-label="Страници на списъка"><Button variant="outline" disabled={!previousCursors.length || !result} onClick={() => { setCursor(previousCursors[previousCursors.length - 1]); setPreviousCursors(previousCursors.slice(0, -1)); }}>Предишна</Button><Button variant="outline" disabled={!result || result.isDone} onClick={() => { if (result) { setPreviousCursors([...previousCursors, cursor]); setCursor(result.continueCursor); } }}>Следваща</Button><Button variant="ghost" onClick={resetPage} disabled={!cursor}>Към първа страница</Button><span className="text-xs text-muted-foreground">Страница {previousCursors.length + 1} · до 20 заявки</span></nav>
    </CardContent>
  </Card>;
}
