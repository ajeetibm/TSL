import { Clock3, Mail, MapPin, Phone, Send, type LucideIcon } from 'lucide-react'
import './DetailContactSection.css'

const contactCards: Array<[string, string, LucideIcon]> = [
  ['Phone', '+27 (0) 11 123 4567', Phone],
  ['Email', 'hello@thestartupalegal.co.za', Mail],
  ['Office', 'Sandton, Johannesburg, South Africa', MapPin],
  ['Hours', 'Mon - Fri: 8:00 AM - 6:00 PM', Clock3],
]

export function DetailContactSection() {
  return (
    <section className="detail-contact">
      <div className="detail-contact__inner">
        <header className="detail-contact__header">
          <span>
            <Mail size={16} />
            Get In Touch
          </span>
          <h2>Let's Start Your Legal Journey</h2>
          <p>Book your free 15-minute consultation. We're your legal partner, not just your lawyer.</p>
        </header>

        <div className="detail-contact__content">
          <form className="detail-contact__form">
            <div className="detail-contact__form-grid">
              <label>
                Full Name *
                <input placeholder="John Doe" />
              </label>
              <label>
                Email Address *
                <input placeholder="john@example.com" />
              </label>
              <label>
                Phone Number
                <input placeholder="+27 82 123 4567" />
              </label>
              <label>
                Company Name
                <input placeholder="Your Company (Pty) Ltd" />
              </label>
            </div>
            <label className="detail-contact__message">
              Message *
              <textarea placeholder="Tell us about your legal needs..." />
            </label>
            <button type="button">Send Message</button>
            <p>By submitting this form, you agree to our Privacy Policy and Terms of Service</p>
          </form>

          <aside className="detail-contact__cards">
            {contactCards.map(([label, value, Icon]) => (
              <article key={label}>
                <span>
                  <Icon size={20} />
                </span>
                <div>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              </article>
            ))}
            <article className="detail-contact__response">
              <h3>Quick Response</h3>
              <p>
                Our team typically responds within 2-4 hours during business hours. For urgent matters, please call us
                directly.
              </p>
              <strong>
                <Send size={14} />
                Available Now
              </strong>
            </article>
          </aside>
        </div>
      </div>
    </section>
  )
}
