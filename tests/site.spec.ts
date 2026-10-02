import {test,expect} from '@playwright/test';
import {backendFixture,catId} from './backendFixture';

test('all public page types render without overflow and preserve legal identity',async({page,context})=>{
 await backendFixture(context);
 for(const path of ['/','/british','/all-cats','/about','/news','/news/test-story',`/cat/${catId}`,'/trust','/contact','/waiting-list','/terms','/privacy','/missing-page']){
  await page.goto(path);await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('header')).toContainText('РЕД ХАВАЛЕ ЕООД');
  await expect(page.locator('footer')).toContainText('202955527');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path).toBeTruthy();
 }
});
test('reservation context survives WhatsApp and waiting-list navigation',async({page,context})=>{
 const state=await backendFixture(context);await page.goto(`/cat/${catId}`);
 await page.getByRole('button',{name:'Резервирай',exact:true}).last().click();
 const dialog=page.getByRole('dialog');await expect(dialog).toContainText('Test Ragdoll');
 const whatsapp=await dialog.getByRole('link',{name:/WhatsApp/}).getAttribute('href');expect(whatsapp).toContain('359894474966');expect(decodeURIComponent(whatsapp||'')).toContain(`/cat/${catId}`);
 await dialog.getByRole('link',{name:/списъка за котенце/}).click();
 await expect(page.locator('#wait-email')).toBeVisible();await page.locator('#wait-email').fill('OWNER@example.test');
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Запишете се в списъка',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:/приета|received/i})).toBeVisible();
 const submitted=state.mutations.find(m=>m.path==='waitingList:submit');expect(submitted?.args.email).toBe('owner@example.test');expect(submitted?.args.context).toMatchObject({catId,url:`/cat/${catId}`});
});
test('waiting-list requires explicit consent and retains data after backend rejection',async({page,context})=>{
 const state=await backendFixture(context);state.failSubmission=true;await page.goto('/waiting-list');
 await page.locator('#wait-phone').fill('0894474966');await page.getByRole('button',{name:'Запишете се в списъка',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('изрично');expect(state.mutations).toHaveLength(0);
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Запишете се в списъка',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('не беше приета');await expect(page.locator('#wait-phone')).toHaveValue('0894474966');
 state.failSubmission=false;await page.getByRole('button',{name:'Запишете се в списъка',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:/приета|received/i})).toBeVisible();
 expect(state.mutations.filter(m=>m.path==='waitingList:submit').at(-1)?.args.phone).toBe('+359894474966');
});
test('cookie rejection blocks tracking and external embeds; choices can be withdrawn',async({page,context})=>{
 const state=await backendFixture(context);await page.goto('/contact');
 await expect(page.locator('iframe')).toHaveCount(0);expect(state.mutations).toHaveLength(0);expect(state.externalRequests).toHaveLength(0);
 await page.getByRole('button',{name:/Отказвам/}).first().click();await page.reload();await expect(page.locator('iframe')).toHaveCount(0);
 await page.getByRole('button',{name:'Настройки на бисквитките',exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await dialog.getByRole('checkbox',{name:/Външно съдържание/}).check();await dialog.getByRole('button',{name:/Запаз/}).click();
 await expect.poll(()=>state.externalRequests.some(url=>url.includes('google.com/maps'))).toBeTruthy();
 await page.getByRole('button',{name:'Настройки на бисквитките',exact:true}).click();await page.getByRole('dialog').getByRole('checkbox',{name:/Външно съдържание/}).uncheck();await page.getByRole('dialog').getByRole('button',{name:/Запаз/}).click();
 await expect(page.locator('iframe')).toHaveCount(0);expect(await page.evaluate(()=>localStorage.getItem('visitor_session_id'))).toBeNull();
});
test('language switch preserves cat route; navigation opens and closes accessibly',async({page,context},testInfo)=>{
 await backendFixture(context);await page.goto(`/cat/${catId}`);await page.getByRole('button',{name:'EN',exact:true}).click();
 await expect(page).toHaveURL(new RegExp(`/cat/${catId}\\?lang=en`));await expect(page.locator('html')).toHaveAttribute('lang','en');
 if(testInfo.project.name==='desktop'){
  const trigger=page.getByRole('button',{name:'Our cats',exact:true});await trigger.focus();await page.keyboard.press('Enter');await expect(page.getByRole('menu')).toBeVisible();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
 }else{
  await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.locator('#public-mobile-menu summary').first().click();await expect(page.locator('#public-mobile-menu').getByRole('link',{name:'All cats',exact:true})).toBeVisible();
 }
});
test('admin validates login and manages waiting-list pagination notes status and confirmed deletion',async({page,context})=>{
 const state=await backendFixture(context);await page.goto('/admin');
 await page.getByLabel(/Парола/).fill('wrong-test-password');await page.getByRole('button',{name:/Влез/}).click();await expect(page.getByLabel(/Парола/)).toBeVisible();
 await page.getByLabel(/Парола/).fill('interface-test-password');await page.getByRole('button',{name:/Влез/}).click();
 const tab=page.getByRole('button',{name:/Чакащи за котенце/});
 if(!await tab.isVisible())await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await tab.click();
 await expect(page.getByRole('heading',{name:'Списък за котенца'})).toBeVisible();await page.getByRole('button',{name:'Следваща',exact:true}).click();await expect(page.getByText('Страница 2 · до 20 заявки')).toBeVisible();
 await page.getByRole('button',{name:'Преглед и управление'}).first().click();await page.getByLabel('Вътрешни бележки').fill('Follow-up discussed.');
 await page.getByLabel('Статус на заявката', {exact:true}).selectOption('contacted');await page.getByRole('button',{name:'Запази промените'}).click();await expect(page.getByRole('status')).toContainText('записани');
 const record=state.submissions.find(r=>r.notes==='Follow-up discussed.');expect(record?.status).toBe('contacted');
 await page.getByRole('button',{name:'Изтрий заявката'}).click();await page.getByRole('button',{name:'Отказ',exact:true}).click();expect(state.submissions).toHaveLength(21);
 await page.getByRole('button',{name:'Изтрий заявката'}).click();await page.getByRole('button',{name:'Потвърди изтриването'}).click();await expect.poll(()=>state.submissions.length).toBe(20);
});
