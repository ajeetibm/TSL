import { Link } from 'react-router-dom'
import { SITE } from '../../constants/site'
import { Container } from './Container'
import './Footer.css'

export function Footer() {
  return (
    <footer className="footer">
      <Container className="footer__bottom">
        <p>© Copyright 2025 {SITE.name}. All rights reserved.</p>
        <nav className="footer__nav">
          <Link to="/signup">Sign Up</Link>
          <Link to="/login">Login</Link>
        </nav>
      </Container>
    </footer>
  )
}
