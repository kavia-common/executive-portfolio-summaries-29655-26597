import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Executive Portfolio Summary title, Total AUM KPI, and Holdings section', () => {
  render(<App />);

  // Page title in Navbar and header
  expect(screen.getAllByText(/Executive Portfolio Summary/i).length).toBeGreaterThan(0);

  // KPI label "Total AUM" should be visible in SummaryCards
  expect(screen.getByText(/Total AUM/i)).toBeInTheDocument();

  // Holdings section header
  // Prefer heading role where available, but fallback to text if role resolution varies
  const holdingsHeading =
    screen.queryByRole('heading', { name: /Holdings/i }) || screen.getByText(/Holdings/i);
  expect(holdingsHeading).toBeInTheDocument();
});
