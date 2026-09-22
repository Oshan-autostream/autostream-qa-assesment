import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecentActivities } from '../api/activityApi';

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return `LKR ${amount.toLocaleString()}`;
};

const formatAppointmentType = (value) => {
  const labels = {
    viewing: 'Viewing',
    test_drive: 'Test Drive',
    follow_up: 'Follow Up',
  };
  return labels[value] || value;
};

const formatTimestampValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimeValue = (value) => {
  if (!value || !/^\d{2}:\d{2}$/.test(String(value))) return value || null;
  const [hours, minutes] = String(value).split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

const labelize = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const sanitizeActivityText = (value) => {
  if (value === null || value === undefined) return value;
  const text = String(value);
  const cleaned = text
    .replace(/\s*function \$model\(name\)\s*\{[\s\S]*?\}\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
};

const buildDetailItems = (activity) => {
  const metadata = activity.metadata || {};
  const changes = activity.changes || {};
  const items = [];

  if (activity.entityType === 'APPOINTMENT') {
    if (metadata.customerName) items.push({ label: 'Customer', value: sanitizeActivityText(metadata.customerName) });
    if (metadata.staffName) items.push({ label: 'Staff', value: sanitizeActivityText(metadata.staffName) });
    if (metadata.appointmentType) items.push({ label: 'Type', value: formatAppointmentType(metadata.appointmentType) });
    if (metadata.vehicleName) items.push({ label: 'Vehicle', value: sanitizeActivityText(metadata.vehicleName) });
    if (metadata.appointmentDate) items.push({ label: 'Date', value: formatTimestampValue(metadata.appointmentDate) });
    if (metadata.time) items.push({ label: 'Time', value: formatTimeValue(metadata.time) });
  }

  if (activity.entityType === 'VEHICLE') {
    if (metadata.brand || metadata.type) items.push({ label: 'Vehicle', value: sanitizeActivityText([metadata.brand, metadata.type].filter(Boolean).join(' ')) });
    if (metadata.year) items.push({ label: 'Year', value: String(metadata.year) });
    if (metadata.vehicleNumber) items.push({ label: 'Reg No', value: metadata.vehicleNumber });
    if (metadata.status) items.push({ label: 'Status', value: labelize(metadata.status) });
    if (metadata.price !== undefined) items.push({ label: 'Price', value: formatMoney(metadata.price) });
  }

  if (activity.entityType === 'SALE') {
    if (metadata.customerName) items.push({ label: 'Customer', value: sanitizeActivityText(metadata.customerName) });
    if (metadata.vehicleName) items.push({ label: 'Vehicle', value: sanitizeActivityText(metadata.vehicleName) });
    if (metadata.payment_status) items.push({ label: 'Payment', value: labelize(metadata.payment_status) });
    if (metadata.payment_method) items.push({ label: 'Method', value: labelize(metadata.payment_method) });
    if (metadata.paid_amount !== undefined) items.push({ label: 'Paid', value: formatMoney(metadata.paid_amount) });
    if (metadata.pending_amount !== undefined) items.push({ label: 'Balance', value: formatMoney(metadata.pending_amount) });
  }

  if (activity.entityType === 'DOCUMENT') {
    if (metadata.title) items.push({ label: 'Document', value: sanitizeActivityText(metadata.title) });
    if (metadata.docType) items.push({ label: 'Type', value: labelize(metadata.docType) });
    if (metadata.vehicleName) items.push({ label: 'Vehicle', value: sanitizeActivityText(metadata.vehicleName) });
    if (metadata.referenceNo) items.push({ label: 'Ref', value: metadata.referenceNo });
    if (metadata.location) items.push({ label: 'Location', value: metadata.location });
    if (metadata.status) items.push({ label: 'Status', value: labelize(metadata.status) });
  }

  if ((activity.actionType === 'UPDATE' || activity.actionType === 'DELETE') && Object.keys(changes).length > 0) {
    const changeSummary = Object.entries(changes)
      .slice(0, 3)
      .map(([key, value]) => {
        if (value && typeof value === 'object' && 'to' in value) {
          return `${labelize(key)}: ${value.to ?? 'Updated'}`;
        }
        if (typeof value === 'string') {
          return `${labelize(key)}: ${value}`;
        }
        return labelize(key);
      })
      .join(' | ');

    if (changeSummary) items.push({ label: 'Changes', value: changeSummary });
  }

  return items.filter((item) => item.value);
};

export default function ActivityPanel({
  limit = 15,
  showViewAll = true,
  viewAllPath = '/admin/activities',
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRecentActivities(limit, 0);
      const items = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setActivities(items);
    } catch (err) {
      setActivities([]);
      setError(err.response?.data?.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivities();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const getActivityIcon = (actionType, entityType) => {
    if (actionType === 'CREATE') return '✨';
    if (actionType === 'UPDATE') return '✏️';
    if (actionType === 'DELETE') return '🗑️';
    if (actionType === 'LOGIN') return '🔓';
    if (actionType === 'LOGOUT') return '🔒';
    if (actionType === 'VIEWED') return '👁️';
    if (actionType === 'SENT_EMAIL') return '📧';

    if (entityType === 'VEHICLE') return '🚗';
    if (entityType === 'LEAD') return '👥';
    if (entityType === 'APPOINTMENT') return '📅';
    if (entityType === 'SALE') return '💰';
    if (entityType === 'STAFF') return '👤';
    if (entityType === 'USER') return '👤';
    if (entityType === 'DOCUMENT') return '📄';
    if (entityType === 'NOTIFICATION') return '🔔';

    return '📌';
  };

  const getActivityColor = (actionType) => {
    if (actionType === 'CREATE') return '#8DBB01';
    if (actionType === 'UPDATE') return '#0C3A57';
    if (actionType === 'DELETE') return '#ba5e5e';
    if (actionType === 'LOGIN') return '#3d8fa5';
    if (actionType === 'LOGOUT') return '#5d6f7b';
    return '#5d6f7b';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();

    // Same day
    if (date.toDateString() === now.toDateString()) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes} today`;
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'yesterday';
    }

    // Within 7 days
    const daysAgo = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      return `${daysAgo}d ago`;
    }

    // Formatted date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: '18px',
      border: '1px solid var(--border)',
      padding: '24px',
      boxShadow: 'var(--shadow-sm)',
      backdropFilter: 'blur(12px)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(21, 32, 43, 0.08)'
      }}>
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
            letterSpacing: '-0.3px'
          }}>
            Recent Activities
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            margin: '4px 0 0 0',
            fontWeight: 300
          }}>
            Latest system changes and updates
          </p>
        </div>
        <button
          onClick={fetchActivities}
          disabled={loading}
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '999px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--primary-soft)')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--bg)')}
        >
          {loading ? '⟳' : '↻ Refresh'}
        </button>
      </div>

      {/* Loading State */}
      {loading && !activities.length && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 500 }}>Loading activities...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c33',
          fontSize: '13px',
          fontWeight: 500,
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* Activities List */}
      {!loading && activities.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activities.map((activity, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.76)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                display: 'flex',
                gap: '12px',
                transition: 'all 0.2s',
                alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.96)';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(12, 58, 87, 0.07)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.76)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Icon Circle */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: getActivityColor(activity.actionType),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
                opacity: 0.9
              }}>
                {getActivityIcon(activity.actionType, activity.entityType)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '2px',
                  lineHeight: '1.3'
                }}>
                  {sanitizeActivityText(activity.title)}
                </div>

                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginBottom: buildDetailItems(activity).length > 0 ? '10px' : '4px',
                  lineHeight: '1.3',
                  fontWeight: 300,
                  wordWrap: 'break-word'
                }}>
                  {sanitizeActivityText(activity.description)}
                </div>

                {buildDetailItems(activity).length > 0 ? (
                  <div style={{ display: 'grid', gap: '8px', marginBottom: '10px' }}>
                    {buildDetailItems(activity).map((item) => (
                      <div
                        key={`${activity._id || idx}-${item.label}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          alignItems: 'center',
                          padding: '8px 10px',
                          borderRadius: '12px',
                          background: 'rgba(244, 246, 242, 0.9)',
                          border: '1px solid rgba(12, 58, 87, 0.06)',
                        }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <span>📅 {formatTime(activity.timestamp)}</span>
                  {activity.userName && (
                    <span>👤 {activity.userName}</span>
                  )}
                  {activity.userRole && (
                    <span style={{
                      padding: '0 6px',
                      backgroundColor: 'var(--primary-soft)',
                      color: 'var(--primary)',
                      borderRadius: '999px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {activity.userRole}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              {activity.status && (
                <div style={{
                  padding: '5px 10px',
                  backgroundColor:
                    activity.status === 'success'
                      ? 'rgba(141, 187, 1, 0.12)'
                      : activity.status === 'failed'
                      ? 'rgba(186, 94, 94, 0.12)'
                      : 'rgba(12, 58, 87, 0.08)',
                  color:
                    activity.status === 'success'
                      ? '#8DBB01'
                      : activity.status === 'failed'
                      ? '#ba5e5e'
                      : '#0C3A57',
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  whiteSpace: 'nowrap'
                }}>
                  {activity.status}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !loading && !error ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '6px' }}>No recent activities yet</div>
          <div style={{ fontSize: '13px' }}>Admin actions like vehicle, sale, and appointment updates will appear here.</div>
        </div>
      ) : null}

      {/* Footer - View All Link */}
      {showViewAll && activities.length > 0 && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(21, 32, 43, 0.08)',
          textAlign: 'center'
        }}>
          <Link to={viewAllPath} style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--primary)',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
            View All Activities →
          </Link>
        </div>
      )}
    </div>
  );
}
