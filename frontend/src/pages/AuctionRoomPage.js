import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function AuctionRoomPage({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [vendorName, setVendorName] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchAuctions();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchAuctions = async () => {
    try {
      const res = await axios.get(`${API}/api/auctions`, { headers });
      const data = res.data.data || res.data;
      setAuctions(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load auctions');
    }
    setLoading(false);
  };

  const joinRoom = (auction) => {
    if (socketRef.current) socketRef.current.disconnect();
    setSelectedAuction(auction);
    setBids([]);

    const socket = io(API);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-auction', auction.id);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new-bid', ({ bid, auction: updatedAuction }) => {
      setBids(prev => [bid, ...prev]);
      setSelectedAuction(updatedAuction);
      toast.info(`New bid: $${bid.bidAmount} by ${bid.vendorName}`);
    });

    socket.on('auction-started', ({ auction: updatedAuction }) => {
      setSelectedAuction(updatedAuction);
      toast.success('Auction is now LIVE!');
    });

    socket.on('auction-closed', ({ auction: updatedAuction }) => {
      setSelectedAuction(updatedAuction);
      toast.info(`Auction closed. Winner: ${updatedAuction.winning_vendor || 'TBD'}`);
    });

    socket.on('bid-error', ({ error }) => toast.error(error));
  };

  const submitBid = () => {
    if (!vendorName || !bidAmount) return toast.error('Enter vendor name and bid amount');
    if (!socketRef.current || !connected) return toast.error('Not connected to auction room');

    socketRef.current.emit('submit-bid', {
      auctionId: selectedAuction.id,
      vendorName,
      bidAmount: parseFloat(bidAmount)
    });

    setBidAmount('');
  };

  const startAuction = async (id) => {
    try {
      const res = await axios.post(`${API}/api/auctions/${id}/start`, {}, { headers });
      setSelectedAuction(res.data);
      fetchAuctions();
      toast.success('Auction started!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start auction');
    }
  };

  const closeAuction = async (id, winnerName) => {
    try {
      await axios.post(`${API}/api/auctions/${id}/close`, { winning_vendor: winnerName }, { headers });
      fetchAuctions();
      toast.success('Auction closed');
    } catch {
      toast.error('Failed to close auction');
    }
  };

  const statusColor = (status) => {
    const colors = { live: '#10b981', scheduled: '#3b82f6', closed: '#6b7280', cancelled: '#ef4444' };
    return colors[status] || '#6b7280';
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading auctions...</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Live Auction Room</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Join auction rooms to participate in real-time reverse bidding</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Auction List */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Available Auctions</h2>
          {auctions.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No auctions found.</p>
          ) : (
            auctions.map(auction => (
              <div key={auction.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '0.75rem',
                background: selectedAuction?.id === auction.id ? '#eff6ff' : '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{auction.auction_title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{auction.category} • {auction.auction_type}</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Starting: ${auction.starting_price ? Number(auction.starting_price).toLocaleString() : 'N/A'}
                      {auction.current_best_bid && ` | Best: $${Number(auction.current_best_bid).toLocaleString()}`}
                    </div>
                  </div>
                  <span style={{
                    background: statusColor(auction.status),
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>{auction.status}</span>
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => joinRoom(auction)}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >Join Room</button>
                  {auction.status === 'scheduled' && (
                    <button
                      onClick={() => startAuction(auction.id)}
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >Start Auction</button>
                  )}
                  {auction.status === 'live' && (
                    <button
                      onClick={() => {
                        const winner = prompt('Enter winning vendor name:');
                        if (winner) closeAuction(auction.id, winner);
                      }}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >Close Auction</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Active Room */}
        <div>
          {selectedAuction ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedAuction.auction_title}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: connected ? '#10b981' : '#ef4444',
                    display: 'inline-block'
                  }} />
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{connected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>

              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div><strong>Status:</strong> <span style={{ color: statusColor(selectedAuction.status), fontWeight: 600 }}>{selectedAuction.status?.toUpperCase()}</span></div>
                  <div><strong>Reserve:</strong> ${selectedAuction.reserve_price ? Number(selectedAuction.reserve_price).toLocaleString() : 'N/A'}</div>
                  <div><strong>Starting Price:</strong> ${selectedAuction.starting_price ? Number(selectedAuction.starting_price).toLocaleString() : 'N/A'}</div>
                  <div><strong>Best Bid:</strong> {selectedAuction.current_best_bid ? `$${Number(selectedAuction.current_best_bid).toLocaleString()}` : 'No bids yet'}</div>
                </div>
              </div>

              {selectedAuction.status === 'live' && (
                <div style={{ border: '2px solid #10b981', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: '#10b981' }}>Submit Bid</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      placeholder="Vendor Name"
                      value={vendorName}
                      onChange={e => setVendorName(e.target.value)}
                      style={{ flex: 1, minWidth: '120px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
                    />
                    <input
                      type="number"
                      placeholder="Bid Amount ($)"
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      style={{ flex: 1, minWidth: '120px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
                    />
                    <button
                      onClick={submitBid}
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}
                    >Submit Bid</button>
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Live Bid Feed</h3>
                {bids.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No bids yet in this session.</p>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {bids.map((bid, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem', borderRadius: '6px',
                        background: i === 0 ? '#ecfdf5' : '#f9fafb',
                        marginBottom: '0.25rem', fontSize: '0.9rem'
                      }}>
                        <span>{bid.vendorName}</span>
                        <span style={{ fontWeight: 600, color: '#10b981' }}>${Number(bid.bidAmount).toLocaleString()}</span>
                        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
              <p>Select an auction from the left to join its room</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
