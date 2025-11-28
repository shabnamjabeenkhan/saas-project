import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';
import { Link } from 'react-router';

export const LovableFAQSection = () => {
  const faqItems = [
    {
      id: 'item-1',
      question: 'Do I need Google Ads experience to use TradeBoost AI?',
      answer: 'Not at all! TradeBoost AI is designed for tradespeople with zero marketing experience. Our AI handles all the technical setup, keyword research, and campaign optimization. You just answer 5 simple questions about your business. Note: You will need a Google Ads account to connect and publish your campaigns.',
    },
    {
      id: 'item-4',
      question: 'Can I use this for both plumbing and electrical work?',
      answer: 'Absolutely! TradeBoost AI supports multi-trade businesses. The Premium plan includes specialized campaigns for different services, so you can promote both plumbing and electrical work to the same customers and maximize your opportunities.',
    },
    {
      id: 'item-5',
      question: 'How much should I budget for Google Ads spend?',
      answer: 'We recommend starting with £100-150/month for Google Ads spend (separate from your TradeBoost AI subscription). This typically generates 10-15 quality leads per month. You control the budget and can adjust it based on results.',
    },
    // {
    //   id: 'item-6',
    //   question: 'What happens during quiet seasons?',
    //   answer: 'Our AI automatically adjusts campaigns for seasonal trends. During slower summer months for heating engineers, it reduces spend and focuses on maintenance services. In winter, it ramps up emergency boiler campaigns. This saves you money year-round.',
    // },
    {
      id: 'item-7',
      question: 'Can I cancel anytime?',
      answer: 'Yes, absolutely no contracts or long-term commitments. You can cancel your TradeBoost AI subscription anytime from your dashboard. Your Google Ads campaigns will continue running until you decide to pause them.',
    },
    {
      id: 'item-8',
      question: 'How is this different from hiring a marketing agency?',
      answer: 'Marketing agencies typically charge £2,000-4,000/month with 6-12 month contracts, plus setup fees. TradeBoost AI costs $69/month with no contracts, no setup fees, and gives you full control and transparency over your campaigns.',
    },
    {
      id: 'item-9',
      question: 'What certifications do I need to use TradeBoost AI?',
      answer: 'All trades require valid Business Registration. It\'s legally required for all engineers who work on boilers, heating systems, gas appliances, and gas pipework to be on the Gas Safe Register. Electricians must have Part P Electrical Certification for domestic electrical work.',
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-24" style={{ backgroundColor: '#18191a' }}>
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-balance text-3xl font-bold md:text-4xl lg:text-5xl">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mt-4 text-balance">Everything you need to know about TradeBoost AI and how it helps UK tradespeople get more leads.</p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion
            type="single"
            collapsible
            className="w-full rounded-2xl border-[0.25px] border-border px-8 py-3 shadow-sm"
          >
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-dashed"
              >
                <AccordionTrigger className="cursor-pointer text-base hover:no-underline text-foreground">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-gray-300">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <p className="text-muted-foreground mt-6 px-8 text-center">
            Can't find what you're looking for? Contact our{' '}
            <Link
              to="#"
              className="text-primary font-medium hover:underline"
            >
              customer support team
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};