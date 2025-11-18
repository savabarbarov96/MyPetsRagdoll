import { motion } from 'framer-motion';

const CatteryIntro = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h3 className="font-playfair text-3xl font-semibold text-foreground">
              BleuRoi Ragdoll Cattery – Вашият Професионален Развъдник за Рагдол Котки
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Лицензиран развъдник BleuRoi Ragdoll Cattery</strong> предлага невероятни <strong className="text-foreground">Ragdoll котенца с родословие</strong>, европейски паспорт, 2 ваксини и чип. Ако мечтаете да имате <strong className="text-foreground">породиста котка</strong> – една от най-красивите и най-спокойни котки на света – попаднахте на правилното място.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Нашите <strong className="text-foreground">Рагдол котенца за продажба</strong> са отгледани с любов и професионална грижа. Родителите на котетата произхождат от <strong className="text-foreground">Европа и Русия</strong> и са носители на шампионски титли с високи оценки от изложби.
            </p>
            <div className="space-y-2 mt-4">
              <p className="text-lg text-foreground font-semibold">Какво предлагаме:</p>
              <ul className="space-y-2 text-lg text-muted-foreground">
                <li>✓ <strong className="text-foreground">Котенца за домашни любимци</strong> (кастрирани и некастрирани)</li>
                <li>✓ <strong className="text-foreground">Изложбени котки</strong> с перспектива за шампионски титли</li>
                <li>✓ <strong className="text-foreground">Селектирани котета</strong> за лицензирана развъдна дейност</li>
                <li>✓ Без забрана за продажба в ЕС</li>
                <li>✓ Организиран транспорт за цялата страна</li>
              </ul>
              <p className="text-lg font-semibold text-foreground mt-4">
                📋 Лиценз 47090/2024 | Регистрирани в FIFe и WCF
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="aspect-video rounded-2xl overflow-hidden shadow-xl border border-border/50">
              <img
                src="/hero-image.jpg"
                alt="Лицензиран развъдник BleuRoi Ragdoll Cattery FIFe WCF България - Породисти Рагдол котки"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card/90 rounded-xl p-4 shadow-lg backdrop-blur-sm border border-border/50">
              <p className="text-sm text-muted-foreground">
                Свържете се с нас за повече снимки и информация
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CatteryIntro;












