import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Каква е цената на Ragdoll котенце в България?",
      answer: "Цената на Ragdoll котенце от BleuRoi варира в зависимост от предназначението (домашен любимец, изложба или развъдна дейност), пола, цвета и родословието. Стандартната цена за домашен любимец включва родословие FIFe/WCF, европейски паспорт, 2 ваксини и микрочип. За точна цена се свържете с нас директно."
    },
    {
      question: "Как мога да купя Ragdoll коте от вашия развъдник?",
      answer: "Процесът е лесен: разгледайте наличните котенца в секция 'Модели', изберете коте, свържете се с нас чрез WhatsApp/Viber/Facebook, направете резервация с депозит и подпишете договор. Котенцата се предават на 12+ седмици с всички документи и ваксини."
    },
    {
      question: "Подходящи ли са Ragdoll котките за деца и семейства?",
      answer: "Да! Ragdoll котките са идеални за семейства с деца. Те са изключително спокойни, нежни и толерантни. Обичат да бъдат на ръце, не се сърдят лесно и имат уравновесен характер. Перфектни като първа котка за дете или като семеен любимец."
    },
    {
      question: "Какво включва родословието на Ragdoll котенцата?",
      answer: "Всички наши котенца получават официално родословие, издадено от FIFe (Fédération Internationale Féline) или WCF (World Cat Federation). Родословието показва произхода на котето до 3-4 поколения назад, включително родители, баби и дядовци – всички с имена, цветове и шампионски титли."
    },
    {
      question: "Организирате ли транспорт на котенцата?",
      answer: "Да, организираме транспорт до цяла България и страните от ЕС. За София и Гоце Делчев е възможна лична среща. За други градове използваме сигурен куриер или професионален транспорт на домашни любимци с необходимите документи."
    },
    {
      question: "Какви здравни гаранции предлагате?",
      answer: "Всички котенца се предават с 2 ваксини, дегелминтизация, микрочип и европейски паспорт. Родителите са тествани за генетични заболявания. Предоставяме договор с 14-дневна здравна гаранция и съвети за грижи. Препоръчваме ветеринарен преглед след получаване."
    },
    {
      question: "Разликата между Ragdoll коте за домашен любимец и за развъдна дейност?",
      answer: "Котенцата за домашен любимец се продават с договор за кастрация (обикновено до 1 година) и са на по-достъпна цена. Котенцата за развъдна дейност или изложби се продават само на лицензирани развъдници с пълни развъдни права и са на по-висока цена поради високото си качество и перспектива."
    },
    {
      question: "На каква възраст котенцата напускат развъдника?",
      answer: "Котенцата напускат развъдника на минимум 12 седмици (3 месеца). На тази възраст те са социализирани, научени на тоалетна, ядат сами твърда храна и имат 2 ваксини. Това е минималният срок за здравословно и емоционално развитие на котето."
    },
    {
      question: "Има ли налични котенца в момента?",
      answer: "Актуалната информация за налични Ragdoll котенца можете да видите в секция 'Модели' или 'Котенца' на сайта. Обновяваме информацията редовно. За резервации на бъдещи котила се свържете с нас директно."
    },
    {
      question: "Какво трябва да подготвя преди да донеса Ragdoll коте у дома?",
      answer: "Основното оборудване включва: тоалетна с пясък (препоръчваме комкуващ), купички за храна и вода, играчки, драскало, транспортна чанта и качествена храна (ние препоръчваме конкретна марка). Предоставяме пълен списък и съвети при предаване на котето."
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-playfair text-3xl md:text-4xl font-semibold mb-4">
            Често Задавани Въпроси за Ragdoll Котки
          </h2>
          <p className="text-muted-foreground text-lg">
            Всичко, което трябва да знаете за закупуване на Рагдол коте от BleuRoi
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors"
              >
                <h3 className="font-semibold text-lg pr-4">{faq.question}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Schema.org FAQ Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </div>
    </section>
  );
};

export default FAQSection;
