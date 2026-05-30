import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../context/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import { Save, User as UserIcon, FileText, Edit2, Mail, Phone, Building, Briefcase, GraduationCap, Link as LinkIcon, X, Award, Star, MessageCircle } from 'lucide-react';
import '../styles/profile.css';

interface RewardStats {
  reward_points: number;
  answered_count: number;
  questions_asked: number;
  rank: number;
}

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate({ to: '/login' });
    return null;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    alternateEmail: user.alternateEmail || '',
    mobile: user.mobile || '',
    collegeName: user.collegeName || '',
    collegeAddress: user.collegeAddress || '',
    collegeWebsite: user.collegeWebsite || '',
    departmentName: user.departmentName || '',
    departmentWebpage: user.departmentWebpage || '',
    programme: user.programme || '',
    branch: user.branch || '',
    gpa: user.gpa || '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [rewardStats, setRewardStats] = useState<RewardStats | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/rewards/my-points/${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => { if (data.found) setRewardStats(data); })
      .catch(() => {});
  }, [user?.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      alternateEmail: user.alternateEmail || '',
      mobile: user.mobile || '',
      collegeName: user.collegeName || '',
      collegeAddress: user.collegeAddress || '',
      collegeWebsite: user.collegeWebsite || '',
      departmentName: user.departmentName || '',
      departmentWebpage: user.departmentWebpage || '',
      programme: user.programme || '',
      branch: user.branch || '',
      gpa: user.gpa || '',
    });
    setIsEditing(false);
  };

  const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.FC<any>, label: string, value: string, href?: string }) => (
    <div className="profile-info-row">
      <div className="profile-info-icon">
        <Icon size={18} />
      </div>
      <div className="profile-info-content">
        <div className="profile-info-label">{label}</div>
        {href && value ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="profile-info-link">{value}</a>
        ) : (
          <div className={`profile-info-value ${!value ? 'profile-info-empty' : ''}`}>
            {value || 'Not provided'}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="profile-page">

      {/* ── 2-Column Layout ── */}
      <div className="profile-layout">

        {/* ── LEFT: Sidebar Card ── */}
        <div className="profile-sidebar">
          <div className="profile-avatar-area">
            <div className="profile-avatar">
              <UserIcon size={48} />
            </div>
            <h1 className="profile-name">{user.name}</h1>
            <div className="profile-email">
              <Mail size={14} /> {user.email}
            </div>
            <span className={`profile-role-badge ${user.role === 'admin' ? 'profile-role-badge--admin' : ''}`}>
              {user.role}
            </span>
          </div>

          {!isEditing && (
            <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} /> Edit Profile
            </button>
          )}

          {/* Spurti Points Section */}
          <div className="profile-sidebar-section">
            <div className="profile-sidebar-section-title">
              <Award size={16} /> Spurti Points
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-glow)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 700, fontSize: '22px' }}>
                  <Star size={18} />
                  {rewardStats?.reward_points ?? (user as any).reward_points ?? 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  <div>Rank #{rewardStats?.rank ?? '–'}</div>
                  <div style={{ color: 'var(--text-muted)' }}>on leaderboard</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{rewardStats?.answered_count ?? 0}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><MessageCircle size={11} /> Answered</div>
                </div>
                <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{rewardStats?.questions_asked ?? 0}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><MessageCircle size={11} /> Asked</div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents mini-section */}
          <div className="profile-sidebar-section">
            <div className="profile-sidebar-section-title">
              <FileText size={16} /> Documents
            </div>
            {user.cvFileName ? (
              <div className="profile-doc-card">
                <FileText size={20} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{user.cvFileName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uploaded CV</div>
                </div>
              </div>
            ) : (
              <div className="profile-doc-empty">No CV uploaded</div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Main Content ── */}
        <div className="profile-main">

          {isSaved && (
            <div className="profile-success-banner">
              <Save size={18} /> Profile updated successfully!
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="profile-form-section">
                <h3 className="profile-section-heading">Personal Information</h3>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">First Name</label>
                    <input className="form-input" id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} placeholder="John" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">Last Name</label>
                    <input className="form-input" id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} placeholder="Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="alternateEmail">Alternate Email</label>
                    <input className="form-input" id="alternateEmail" name="alternateEmail" type="email" value={formData.alternateEmail} onChange={handleChange} placeholder="alt@example.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="mobile">Mobile Phone</label>
                    <input className="form-input" id="mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
              </div>

              <div className="profile-form-section">
                <h3 className="profile-section-heading">College Details</h3>
                <div className="profile-form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="collegeName">College Name</label>
                    <input className="form-input" id="collegeName" name="collegeName" type="text" value={formData.collegeName} onChange={handleChange} placeholder="e.g. Indian Institute of Technology" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="collegeAddress">Full Address</label>
                    <input className="form-input" id="collegeAddress" name="collegeAddress" type="text" value={formData.collegeAddress} onChange={handleChange} placeholder="Street, City, State, ZIP" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="collegeWebsite">College Website</label>
                    <input className="form-input" id="collegeWebsite" name="collegeWebsite" type="url" value={formData.collegeWebsite} onChange={handleChange} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="departmentName">Department</label>
                    <input className="form-input" id="departmentName" name="departmentName" type="text" value={formData.departmentName} onChange={handleChange} placeholder="e.g. Computer Science" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="departmentWebpage">Department Webpage</label>
                    <input className="form-input" id="departmentWebpage" name="departmentWebpage" type="url" value={formData.departmentWebpage} onChange={handleChange} placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div className="profile-form-section">
                <h3 className="profile-section-heading">Academic Information</h3>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="programme">Programme</label>
                    <input className="form-input" id="programme" name="programme" type="text" value={formData.programme} onChange={handleChange} placeholder="B.Tech, M.Tech, etc." />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="branch">Branch</label>
                    <input className="form-input" id="branch" name="branch" type="text" value={formData.branch} onChange={handleChange} placeholder="CS/Data Science/Math etc" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="gpa">GPA / Percentage</label>
                    <input className="form-input" id="gpa" name="gpa" type="text" value={formData.gpa} onChange={handleChange} placeholder="e.g. 8.5 CGPA" />
                  </div>
                </div>
              </div>

              <div className="profile-form-actions">
                <button type="button" onClick={handleCancel} className="profile-cancel-btn">
                  <X size={16} /> Cancel
                </button>
                <button type="submit" className="profile-save-btn">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="profile-view-section">
                <h3 className="profile-section-heading"><UserIcon size={18} /> Personal Details</h3>
                <div className="profile-info-grid">
                  <InfoRow icon={UserIcon} label="First Name" value={user.firstName || ''} />
                  <InfoRow icon={UserIcon} label="Last Name" value={user.lastName || ''} />
                  <InfoRow icon={Mail} label="Alternate Email" value={user.alternateEmail || ''} href={user.alternateEmail ? `mailto:${user.alternateEmail}` : undefined} />
                  <InfoRow icon={Phone} label="Mobile" value={user.mobile || ''} />
                </div>
              </div>

              <div className="profile-view-section">
                <h3 className="profile-section-heading"><Building size={18} /> College & Department</h3>
                <div className="profile-info-grid">
                  <InfoRow icon={Building} label="College" value={user.collegeName || ''} />
                  <InfoRow icon={Building} label="Address" value={user.collegeAddress || ''} />
                  <InfoRow icon={LinkIcon} label="College Website" value={user.collegeWebsite || ''} href={user.collegeWebsite} />
                  <InfoRow icon={Briefcase} label="Department" value={user.departmentName || ''} />
                  <InfoRow icon={LinkIcon} label="Dept. Webpage" value={user.departmentWebpage || ''} href={user.departmentWebpage} />
                </div>
              </div>

              <div className="profile-view-section">
                <h3 className="profile-section-heading"><GraduationCap size={18} /> Academics</h3>
                <div className="profile-info-grid profile-info-grid--3">
                  <InfoRow icon={GraduationCap} label="Programme" value={user.programme || ''} />
                  <InfoRow icon={Briefcase} label="Branch" value={user.branch || ''} />
                  <InfoRow icon={FileText} label="GPA" value={user.gpa || ''} />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
