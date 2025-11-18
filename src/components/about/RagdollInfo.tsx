import { motion } from 'framer-motion';

const RagdollInfo = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="font-playfair text-3xl font-semibold text-foreground mb-4"
            >
              Защо да Изберете Ragdoll Котка? Информация за Породата
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-muted-foreground"
            >
              <strong className="text-foreground">Котките Рагдол</strong> са известни като най-нежните и най-спокойни породисти котки. С копринена козина, огромни сини очи и уравновесен характер, те са <strong className="text-foreground">перфектни за семейства с деца</strong>. Името "Ragdoll" (парцалена кукла) идва от тяхната характерна мекота и релаксация.
            </motion.p>
          </div>

          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm"
            >
              <h4 className="font-semibold text-lg mb-2">Произход на Ragdoll Котките</h4>
              <p className="text-muted-foreground">
                Страна на произход: Америка (Калифорния, 1960-те години). Резултат от кръстосване между бяла персийска котка и Бирман. Признати от FIFe и WCF като една от най-красивите породи котки в света.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm"
            >
              <h4 className="font-semibold text-lg mb-2">Характер – Спокойна Котка за Деца</h4>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Рагдол котките</strong> са изключително нежни, спокойни и предани. Лесно се адаптират и са отлични семейни любимци. Обичат да бъдат на ръце и са толерантни към деца. Идеални като <strong className="text-foreground">котка подарък за семейство</strong>.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm"
            >
              <h4 className="font-semibold text-lg mb-2">Външен Вид – Красота и Елегантност</h4>
              <p className="text-muted-foreground">
                Големи и мощни котки (4-9 кг) с широки гърди и дълга пухкава опашка. Козината е копринена, средна до дълга, често с „яка" и „панталони". Характерни сини очи и аристократичен вид.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm"
            >
              <h4 className="font-semibold text-lg mb-2">Цветове и Модели</h4>
              <p className="text-muted-foreground">
                Три основни модела: Colorpoint, Mitted, Bicolor. Цветове: Seal, Blue, Chocolate, Lilac, Red, Cream и техни комбинации. Всяка комбинация прави котката уникална и красива.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RagdollInfo;












