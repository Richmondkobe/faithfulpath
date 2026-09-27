import type { Metadata } from "next";

import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact | Faithful Path Community",
  description:
    "Questions about the ministry, speaking or your account. For a private conversation about your own situation, book a session instead.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return <ContactForm />;
}
