import './DetailFooter.css'

const footerGroups = {
  'Quick Links': ['About Us', 'How It Works', 'Pricing', 'FAQ', 'Contact'],
  Services: ['Wizards', 'Get Counsel', 'Playbooks', 'CIPC Services', 'Company Registration'],
  Legal: ['Privacy Policy', 'Terms & Conditions', 'POPIA Compliance', 'Refund Policy'],
}

export function DetailFooter() {
  return (
    <footer className="detail-footer">
      <div className="detail-footer__inner">
        <div className="detail-footer__main">
          <div className="detail-footer__brand">
            <h2>The Startup Legal</h2>
            <p>
              Simplifying South African legal processes for startups and SMEs. CIPC registered agents providing
              transparent, affordable legal services.
            </p>
            <div>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="detail-footer__social-mark">
                in
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className="detail-footer__social-mark">
                ig
              </a>
            </div>
          </div>

          {Object.entries(footerGroups).map(([title, links]) => (
            <nav className="detail-footer__group" key={title}>
              <h3>{title}</h3>
              {links.map((link) => (
                <a key={link} href="/contact">
                  {link}
                </a>
              ))}
            </nav>
          ))}
        </div>

        <div className="detail-footer__bottom">
          <p>© Copyright 2025 The Legal Startup. All rights reserved.</p>
          <div>
            <a href="/wizard-catalogue">Sign Up</a>
            <a href="/">Login</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
