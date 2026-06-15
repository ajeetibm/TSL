import { CircleUserRound, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SITE } from '../../constants/site'
import { Container } from './Container'
import './Footer.css'

const footerLinks = {
  'Quick Links': ['About Us', 'How It Works', 'Pricing', 'FAQ', 'Contact'],
  Services: ['Wizards', 'Get Counsel', 'Playbooks', 'CIPC Services', 'Company Registration'],
  Legal: ['Privacy Policy', 'Terms & Conditions', 'POPIA Compliance', 'Refund Policy'],
}

export function Footer() {
  return (
    <footer className="footer">
      <Container className="footer__top">
        <div>
          <h2 className="footer__brand-title">{SITE.name}</h2>
          <p className="footer__brand-copy">
            Simplifying South African legal processes for startups and SMEs with transparent,
            affordable legal workflows.
          </p>
          <div className="footer__socials">
            <a className="footer__social-link" href="https://linkedin.com" aria-label="LinkedIn">
              <Link2 size={18} />
            </a>
            <a className="footer__social-link" href="https://instagram.com" aria-label="Instagram">
              <CircleUserRound size={18} />
            </a>
          </div>
        </div>

        <div className="footer__links">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="footer__group-title">{title}</h3>
              <ul className="footer__group-list">
                {links.map((link) => (
                  <li key={link}>
                    <Link to="/contact">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <Container className="footer__bottom">
        <p>© Copyright 2026 The Legal Startup. All rights reserved.</p>
        <p>
          Founded by <span className="footer__highlight">Muzukile Soni</span> · Proudly South African
        </p>
      </Container>
    </footer>
  )
}
