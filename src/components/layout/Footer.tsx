import { Link } from 'react-router-dom'
import { SITE } from '../../constants/site'
import { Container } from './Container'
import './Footer.css'

export function Footer() {
  return (
    <footer className="footer">
      <Container className="footer__bottom">
        <p>© Copyright 2025 {SITE.name}. All rights reserved.</p>
        <p>
          Founded by <span className="footer__highlight">Mzuzukile Soni</span> • Proudly South
          African • IBM Techscale Partner
        </p>
        <nav className="footer__nav">
          <Link to="/signup">Sign Up</Link>
          <Link to="/login">Login</Link>
        </nav>
      </Container>
    </footer>
  )
}
