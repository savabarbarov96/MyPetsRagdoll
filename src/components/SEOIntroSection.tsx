import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const SEOIntroSection = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 leading-tight">
            Вашият Надежден Развъдник за Ragdoll Котки в България
          </h2>

          <div className="max-w-4xl mx-auto space-y-6 text-lg text-muted-foreground">
            <p>
              Търсите <strong className="text-foreground">Ragdoll котенца за продажба</strong> с европейско качество и гаранция?
              BleuRoi Ragdoll Cattery е <strong className="text-foreground">лицензиран развъдник</strong> на породисти Рагдол котки
              с родословие, европейски паспорт, 2 ваксини и чип. Предлагаме <strong className="text-foreground">малки котки Ragdoll</strong> от
              шампионски родители с произход от Европа и Русия.
            </p>

            <p>
              Нашите <strong className="text-foreground">Рагдол котенца</strong> са перфектни за семейства – <strong className="text-foreground">спокойни,
              нежни и подходящи за деца</strong>. Всяко <strong className="text-foreground">коте с родословие</strong> е отгледано с любов и
              професионална грижа. Разполагаме с <strong className="text-foreground">котки за продажба</strong> целогодишно –
              за домашни любимци, изложби и лицензирана развъдна дейност.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-1">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Родословие FIFe/WCF</h3>
                <p className="text-muted-foreground">
                  Всички котенца с официално родословие от международно признати организации
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-1">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Здрави Котета</h3>
                <p className="text-muted-foreground">
                  2 ваксини, микрочип, европейски паспорт и здравна гаранция
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-1">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Транспорт в Цяла България</h3>
                <p className="text-muted-foreground">
                  Организираме сигурна доставка на котенцето до вашия дом
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Лиценз 47090/2024</strong> |
            Регистрирани в <strong className="text-foreground">FIFe и WCF</strong> |
            Шампионски родители с високи оценки
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SEOIntroSection;
