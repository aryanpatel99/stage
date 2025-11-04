"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  subsets: ["latin"],
});

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  title?: string;
  faqs?: FAQItem[];
}

const defaultFAQs: FAQItem[] = [
  {
    question: "What is Stage?",
    answer: "Stage is a modern web-based canvas editor for creating stunning visual designs. Upload images, add text overlays, customize backgrounds, and export high-quality graphics—all in your browser.",
  },
  {
    question: "Do I need an account?",
    answer: "Yes. Sign up with Google to access the editor and save your designs. It's free and takes just seconds.",
  },
  {
    question: "Is it free?",
    answer: "Yes! Stage is completely free. Create unlimited designs, save them to your account, and export without any restrictions.",
  },
  {
    question: "What can I create with Stage?",
    answer: "Create social media graphics, image showcases, and visual designs. Upload images, add custom text overlays, choose from gradients or solid backgrounds, apply presets for instant styling, and export in high quality.",
  },
  {
    question: "What formats can I export?",
    answer: "Export as PNG (with transparency) or JPG. Adjust quality (for JPG) and scale (up to 5x) for your needs. Exported images include a Stage watermark.",
  },
  {
    question: "What aspect ratios are available?",
    answer: "Choose from Instagram formats (Square, Portrait, Story/Reel), social media formats (Landscape, Portrait), and standard photo formats. All presets are optimized for their respective platforms.",
  },
  {
    question: "Can I use presets?",
    answer: "Yes! Stage includes 5 ready-made presets: Social Ready, Story Style, Minimal Clean, Bold Gradient, and Dark Elegant. Apply them instantly to get professional-looking designs.",
  },
  {
    question: "What image formats are supported?",
    answer: "Upload PNG, JPG, JPEG, or WEBP images. Maximum file size is 10MB per image.",
  },
  {
    question: "Can I save my designs?",
    answer: "Yes! Save your designs with custom names and descriptions. Access them anytime from your designs gallery to continue editing or export again.",
  },
  {
    question: "What customization options do I have?",
    answer: "Control image size, opacity, borders, shadows, and border radius. Add multiple text overlays with custom fonts, colors, sizes, positions, and text shadows. Choose from gradients, solid colors, or upload your own background images.",
  },
];

export function FAQ({ title = "Frequently Asked Questions", faqs = defaultFAQs }: FAQProps) {
  return (
    <section className="w-full py-12 sm:py-16 px-4 sm:px-6 border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-3xl">
        <h2 className={`text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 ${instrumentSerif.className}`}>
          {title}
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
              <AccordionTrigger className="text-left text-base sm:text-sm font-semibold py-4 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

