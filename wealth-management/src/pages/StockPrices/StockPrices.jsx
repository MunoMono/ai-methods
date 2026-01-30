import { useState, useEffect } from 'react';
import {
  Grid,
  Column,
  Tile,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  Tag,
  InlineLoading,
  InlineNotification
} from '@carbon/react';
import { Renew } from '@carbon/icons-react';
import './StockPrices.scss';

const StockPrices = ({ portfolio }) => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Extract stock tickers from portfolio
  const stockHoldings = portfolio.holdings.filter(h => 
    h.ticker && !['GBP CASH', 'ERNS'].includes(h.ticker)
  );

  const headers = [
    { key: 'ticker', header: 'Ticker' },
    { key: 'name', header: 'Name' },
    { key: 'price', header: 'Current Price' },
    { key: 'change', header: '% Change' },
    { key: 'volume', header: 'Volume' },
    { key: 'updated', header: 'Last Updated' }
  ];

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulated API call - replace with real API like Alpha Vantage, Yahoo Finance, etc.
      // For now, generate mock data
      const mockPrices = {};
      
      stockHoldings.forEach(holding => {
        const basePrice = Math.random() * 100 + 50;
        const change = (Math.random() - 0.5) * 10;
        
        mockPrices[holding.ticker] = {
          ticker: holding.ticker,
          name: holding.holding,
          price: `£${basePrice.toFixed(2)}`,
          change: change.toFixed(2),
          volume: Math.floor(Math.random() * 1000000).toLocaleString(),
          updated: new Date().toLocaleTimeString('en-GB')
        };
      });
      
      setPrices(mockPrices);
      setLastUpdate(new Date());
      
      // TODO: Replace with real API call
      // Example using fetch:
      // const responses = await Promise.all(
      //   stockHoldings.map(h => 
      //     fetch(`https://api.example.com/quote/${h.ticker}`)
      //   )
      // );
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const rows = stockHoldings.map(holding => {
    const priceData = prices[holding.ticker] || {};
    return {
      id: holding.ticker,
      ticker: holding.ticker,
      name: holding.holding,
      price: priceData.price || '-',
      change: priceData.change || '0.00',
      volume: priceData.volume || '-',
      updated: priceData.updated || '-'
    };
  });

  return (
    <div className="stock-prices-page" style={{ padding: '2rem', background: '#262626', minHeight: '100vh' }}>
      <Grid narrow>
        <Column lg={14} md={8} sm={4}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem',
            padding: '1.5rem',
            background: '#393939',
            borderLeft: '4px solid #24a148'
          }}>
            <div>
              <h3 style={{ margin: 0, color: '#f4f4f4', fontSize: '1.75rem', fontWeight: 400 }}>Live Stock Prices</h3>
              <p style={{ margin: '0.5rem 0 0 0', color: '#c6c6c6', fontSize: '0.875rem' }}>
                {lastUpdate ? `Last updated: ${lastUpdate.toLocaleTimeString('en-GB')}` : 'Loading prices...'}
              </p>
            </div>
            <Button
              renderIcon={Renew}
              onClick={fetchPrices}
              disabled={loading}
              size="lg"
            >
              {loading ? 'Refreshing...' : 'Refresh Prices'}
            </Button>
          </div>
        </Column>

        {error && (
          <Column lg={14} md={8} sm={4}>
            <InlineNotification
              kind="error"
              title="Error fetching prices"
              subtitle={error}
              onCloseButtonClick={() => setError(null)}
            />
          </Column>
        )}

        <Column lg={14} md={8} sm={4}>
          <Tile style={{ background: '#393939', padding: 0 }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <InlineLoading description="Fetching latest prices..." />
              </div>
            ) : (
              <DataTable rows={rows} headers={headers}>
                {({ rows, headers, getHeaderProps, getTableProps }) => (
                  <TableContainer>
                    <Table {...getTableProps()} className="stock-prices-table">
                      <TableHead>
                        <TableRow>
                          {headers.map(header => (
                            <TableHeader {...getHeaderProps({ header })} key={header.key}>
                              {header.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map(row => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <strong style={{ color: '#78a9ff' }}>{row.cells[0].value}</strong>
                            </TableCell>
                            <TableCell>{row.cells[1].value}</TableCell>
                            <TableCell>
                              <strong style={{ color: '#f4f4f4' }}>{row.cells[2].value}</strong>
                            </TableCell>
                            <TableCell>
                              <Tag 
                                type={parseFloat(row.cells[3].value) >= 0 ? 'green' : 'red'}
                                size="sm"
                              >
                                {parseFloat(row.cells[3].value) >= 0 ? '+' : ''}{row.cells[3].value}%
                              </Tag>
                            </TableCell>
                            <TableCell>{row.cells[4].value}</TableCell>
                            <TableCell style={{ color: '#c6c6c6', fontSize: '0.875rem' }}>
                              {row.cells[5].value}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DataTable>
            )}
          </Tile>
        </Column>

        <Column lg={14} md={8} sm={4}>
          <Tile style={{ background: '#393939', padding: '1.5rem', marginTop: '1rem' }}>
            <h4 style={{ color: '#f4f4f4', marginBottom: '1rem' }}>📊 API Integration</h4>
            <p style={{ color: '#c6c6c6', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Currently showing <strong>simulated data</strong>. To get real-time prices:
            </p>
            <ul style={{ color: '#c6c6c6', fontSize: '0.875rem', paddingLeft: '1.5rem' }}>
              <li>Integrate with Alpha Vantage API (free tier available)</li>
              <li>Use Yahoo Finance API for delayed quotes</li>
              <li>Connect to your broker's API (IBKR, etc.)</li>
              <li>Set up automatic refresh intervals</li>
            </ul>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
};

export default StockPrices;
