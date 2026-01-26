import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { toast } from 'react-toastify';
import { rewardSettingsAPI } from '../services/api';
import { FaSave, FaUndo, FaGift, FaUserPlus, FaNetworkWired, FaWallet, FaPlus, FaChartLine } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const RewardSettingsManagement = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingBalance, setAddingBalance] = useState(false);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [balanceToAdd, setBalanceToAdd] = useState('');
  const [settings, setSettings] = useState({
    levelGifts: {},
    firstPaymentReferral: 0.05,
    signupPoints: { enabled: true, amount: 50 },
    enableLevelGifts: true,
    poolStats: {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await rewardSettingsAPI.getSettings();
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load reward settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelGiftChange = (level, value) => {
    const amount = parseFloat(value);
    setSettings(prev => ({
      ...prev,
      levelGifts: {
        ...prev.levelGifts,
        [level]: isNaN(amount) ? 0 : amount
      }
    }));
  };

  const handleReferralChange = (value) => {
    // value is percentage (0-100) from input, convert to 0-1 for state
    const percentage = parseFloat(value) / 100;
    setSettings(prev => ({
      ...prev,
      firstPaymentReferral: percentage
    }));
  };

  const handleSignupPointsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      signupPoints: {
        ...prev.signupPoints,
        [field]: value
      }
    }));
  };

  const handleToggleLevelGifts = () => {
    setSettings(prev => ({
      ...prev,
      enableLevelGifts: !prev.enableLevelGifts
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await rewardSettingsAPI.updateSettings(settings);
      toast.success('Reward settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBalance = async () => {
    try {
      const amount = parseFloat(balanceToAdd);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid positive amount');
        return;
      }

      setAddingBalance(true);
      await rewardSettingsAPI.addToGiftsBalance(amount);
      toast.success(`Successfully added ${amount} points to Gifts Balance`);
      setShowAddBalanceModal(false);
      setBalanceToAdd('');
      await fetchSettings(); // Refresh to show new balance
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error(error.response?.data?.message || 'Failed to add balance');
    } finally {
      setAddingBalance(false);
    }
  };

  const levels = ['B', 'D', 'F', 'H', 'J'];

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 50vh;
            color: #666;
            gap: 1rem;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="settings-container">
        <div className="settings-grid">

          {/* System Stats Overview Card */}
          <div className="card stats-card">
            <div className="card-header">
              <div className="card-title-wrap">
                <FaChartLine className="card-icon" />
                <h2>{t("economy.systemOverview")}</h2>
              </div>
            </div>

            <div className="card-body">
              <div className="advanced-stats-grid">
                <div className="adv-stat-item">
                  <span className="label">{t("economy.totalRevenue")}</span>
                  <span className="value revenue">
                    {(settings.appStats?.totalRevenue || 0).toLocaleString()} <small>{t("economy.pts")}</small>
                  </span>
                </div>

                <div className="adv-stat-item">
                  <span className="label">{t("economy.totalDistributed")}</span>
                  <span className="value distributed">
                    {(settings.userStats?.totalDistributed || 0).toLocaleString()} <small>{t("economy.pts")}</small>
                  </span>
                </div>

                <div className="adv-stat-item mini">
                  <span className="label">{t("economy.signupGiftsTotal")}</span>
                  <span className="value">
                    {(settings.poolStats?.signupSpent || 0).toLocaleString()} {t("economy.pts")}
                  </span>
                </div>

                <div className="adv-stat-item mini">
                  <span className="label">{t("economy.levelGiftsTotal")}</span>
                  <span className="value">
                    {(settings.poolStats?.levelSpent || 0).toLocaleString()} {t("economy.pts")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gifts Points Pool Management Card */}
          <div className="card balance-card">
            <div className="card-header">
              <div className="card-title-wrap">
                <FaWallet className="card-icon" />
                <h2>{t("economy.poolManagement")}</h2>
              </div>
            </div>

            <div className="card-body">
              <div className="pool-stats-summary">
                <div className="stat-item">
                  <span className="label">{t("economy.poolIncome")}</span>
                  <span className="value earned">
                    {(settings.poolStats?.totalEarned || 0).toLocaleString()} <small>{t("economy.pts")}</small>
                  </span>
                </div>

                <div className="stat-item">
                  <span className="label">{t("economy.poolExpenses")}</span>
                  <span className="value spent">
                    {(settings.poolStats?.totalSpent || 0).toLocaleString()} <small>{t("economy.pts")}</small>
                  </span>
                </div>
              </div>

              <div className="balance-display-modern">
                <div className="balance-info">
                  <span className="balance-label">{t("economy.currentBalance")}</span>
                  <div className="balance-amount">
                    {(settings.poolStats?.balance || 0).toLocaleString()}
                    <span className="balance-unit">{t("economy.points")}</span>
                  </div>
                </div>

                <button className="btn-add-balance" onClick={() => setShowAddBalanceModal(true)}>
                  <FaPlus /> {t("economy.manualDeposit")}
                </button>
              </div>

              <p className="pool-disclaimer">
                {t("economy.balanceNote")}
              </p>
            </div>
          </div>

          {/* Section 1: Level Upgrade Gifts */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-wrap">
                <FaGift className="card-icon" />
                <h2>{t("economy.levelUpgradeGifts")}</h2>
              </div>

              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableLevelGifts}
                  onChange={handleToggleLevelGifts}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="card-body">
              <p className="description">
                {t("economy.levelUpgradeDescription")}
              </p>

              <div className={`levels-grid ${!settings.enableLevelGifts ? "disabled" : ""}`}>
                {levels.map(level => (
                  <div key={level} className="input-group">
                    <label>{t("economy.level")} {level}</label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={settings.levelGifts?.[level] || 0}
                        onChange={(e) => handleLevelGiftChange(level, e.target.value)}
                        disabled={!settings.enableLevelGifts}
                      />
                      <span className="suffix">{t("economy.pts")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Referral Bonus */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-wrap">
                <FaNetworkWired className="card-icon" />
                <h2>{t("economy.referralBonus")}</h2>
              </div>
            </div>

            <div className="card-body">
              <p className="description">
                {t("economy.referralDescription")}
              </p>

              <div className="input-group full-width">
                <label>{t("economy.referralLabel")}</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={((settings.firstPaymentReferral || 0) * 100).toFixed(1)}
                    onChange={(e) => handleReferralChange(e.target.value)}
                  />
                  <span className="suffix">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Signup Gifts */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-wrap">
                <FaUserPlus className="card-icon" />
                <h2>{t("economy.signupGifts")}</h2>
              </div>

              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.signupPoints?.enabled}
                  onChange={(e) => handleSignupPointsChange("enabled", e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="card-body">
              <p className="description">
                {t("economy.signupDescription")}
              </p>

              <div className={`input-group full-width ${!settings.signupPoints?.enabled ? "disabled" : ""}`}>
                <label>{t("economy.pointsAmount")}</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    min="0"
                    value={settings.signupPoints?.amount || 0}
                    onChange={(e) => handleSignupPointsChange("amount", parseFloat(e.target.value))}
                    disabled={!settings.signupPoints?.enabled}
                  />
                  <span className="suffix">{t("economy.pts")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="actions-bar">
          <button className="btn-secondary" onClick={fetchSettings} disabled={saving}>
            <FaUndo /> {t("economy.reset")}
          </button>

          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? t("economy.saving") : t("economy.saveChanges")}
          </button>
        </div>

        {/* Add Balance Modal */}
        {showAddBalanceModal && (
          <div className="modal-overlay" onClick={() => setShowAddBalanceModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>{t("economy.addFundsTitle")}</h3>
              <p className="modal-description">{t("economy.addFundsDescription")}</p>

              <div className="input-group full-width">
                <label>{t("economy.amount")}</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    min="0"
                    value={balanceToAdd}
                    onChange={(e) => setBalanceToAdd(e.target.value)}
                    placeholder={t("economy.enterAmount")}
                    autoFocus
                  />
                  <span className="suffix">{t("economy.pts")}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowAddBalanceModal(false)} disabled={addingBalance}>
                  {t("economy.cancel")}
                </button>
                <button className="btn-primary" onClick={handleAddBalance} disabled={addingBalance}>
                  {addingBalance ? t("economy.adding") : t("economy.addFunds")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>


      <style jsx>{`
        .settings-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        // .header {
        //   margin-bottom: 30px;
        // }

        // .header h1 {
        //   font-size: 28px;
        //   color: #2c3e50;
        //   margin: 0 0 10px 0;
        // }

        .subtitle {
          color: #7f8c8d;
          font-size: 16px;
          margin: 0;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: transform 0.2s;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        }

        .card-header {
          padding: 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .card-icon {
          color: #3498db;
          font-size: 20px;
        }

        .card-header h2 {
          font-size: 18px;
          margin: 0;
          color: #2c3e50;
          font-weight: 600;
        }

        .card-body {
          padding: 20px;
        }

        .description {
          font-size: 14px;
          color: #7f8c8d;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .levels-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 600;
          color: #34495e;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrapper input {
          width: 100%;
          padding: 10px 35px 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }

        .suffix {
          position: absolute;
          right: 12px;
          color: #95a5a6;
          font-size: 14px;
          font-weight: 500;
        }

        .disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        /* Toggle Switch */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
        }

        input:checked + .slider {
          background-color: #2ecc71;
        }

        input:checked + .slider:before {
          transform: translateX(20px);
        }

        .slider.round {
          border-radius: 24px;
        }

        .slider.round:before {
          border-radius: 50%;
        }

        /* Actions Bar */
        .actions-bar {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .btn-primary, .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 10px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3498db;
          color: white;
        }

        .btn-primary:hover {
          background: #2980b9;
          transform: translateY(-1px);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-secondary {
          background: #ecf0f1;
          color: #2c3e50;
        }

        .btn-secondary:hover {
          background: #bdc3c7;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
          .levels-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Stats Cards Layout */
        .stats-card, .balance-card {
            grid-column: span 2;
        }

        .advanced-stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }

        .adv-stat-item {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .adv-stat-item.mini {
            padding: 12px 15px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
        }

        .adv-stat-item .label {
            font-size: 13px;
            color: #64748b;
            font-weight: 600;
        }

        .adv-stat-item .value {
            font-size: 20px;
            font-weight: 700;
        }

        .adv-stat-item .value.revenue { color: #8b5cf6; } 
        .adv-stat-item .value.distributed { color: #3b82f6; }

        @media (max-width: 600px) {
            .advanced-stats-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Pool Card Styles */
        .balance-card {
          grid-column: span 2;
        }

        .pool-stats-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }

        .stat-item {
          background: #f8fafc;
          padding: 15px;
          border-radius: 12px;
          border-left: 4px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .stat-item .label {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        .stat-item .value {
          font-size: 24px;
          font-weight: 700;
        }

        .stat-item .value.earned { color: #10b981; }
        .stat-item .value.spent { color: #f43f5e; }

        .balance-display-modern {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .balance-info .balance-label {
          font-size: 14px;
          opacity: 0.8;
          font-weight: 500;
          display: block;
          margin-bottom: 4px;
        }

        .balance-info .balance-amount {
          font-size: 38px;
          font-weight: 800;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .balance-info .balance-unit {
          font-size: 16px;
          font-weight: 600;
          opacity: 0.7;
        }

        .pool-disclaimer {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 15px;
          font-style: italic;
        }

        .btn-add-balance {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-add-balance:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }

        .modal-content h3 {
          margin: 0 0 10px 0;
          font-size: 24px;
          color: #2c3e50;
        }

        .modal-description {
          color: #7f8c8d;
          margin-bottom: 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .full-width {
          width: 100%;
        }
      `}</style>
    </Layout>
  );
};

export default RewardSettingsManagement;
