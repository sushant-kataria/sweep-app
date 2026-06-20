type Props = {
  isSecFiler: boolean | null;
  loading?: boolean;
};

export function StockSecFilerBadge({ isSecFiler, loading }: Props) {
  if (loading || isSecFiler === null) return null;

  if (isSecFiler) {
    return (
      <span
        className="stock-sec-badge stock-sec-badge--filer"
        title="Registered with the SEC — financials from EDGAR (10-K/10-Q or 20-F/6-K for foreign issuers)."
      >
        SEC filer
      </span>
    );
  }

  return (
    <span
      className="stock-sec-badge stock-sec-badge--non-filer"
      title="This symbol is not in the SEC company index. Price and chart data may still be available, but EDGAR financials are not."
    >
      No SEC filings
    </span>
  );
}
