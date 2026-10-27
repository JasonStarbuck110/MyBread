import PriceHistoryChart from './PriceHistoryChart'
export default function PortfolioChart({ total }) {
  return <PriceHistoryChart total={total} refreshKey={total} />
}
