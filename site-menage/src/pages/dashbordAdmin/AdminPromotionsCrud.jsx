import React, { useEffect, useState } from 'react';
import './AdminCrud.css';
import { supabase } from '../../lib/supabase';

export default function AdminPromotionsCrud({ token, onAuthError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ id: null, code: '', discount: '', start_date: '', end_date: '', is_active: true });
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading promotions:', error);
        setError('Impossible de charger les promotions: ' + error.message);
        return;
      }

      setItems(data || []);
    } catch (e) {
      console.error('Exception loading promotions:', e);
      setError('Impossible de charger les promotions: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        code: form.code,
        discount: Number(form.discount),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: !!form.is_active
      };

      let data, error;
      
      if (form.id) {
        // Update existing promotion
        const { data: updateData, error: updateError } = await supabase
          .from('promotions')
          .update(submitData)
          .eq('id', form.id)
          .select();
        data = updateData && updateData.length > 0 ? updateData[0] : null;
        error = updateError;
      } else {
        // Create new promotion
        const { data: insertData, error: insertError } = await supabase
          .from('promotions')
          .insert([submitData])
          .select();
        data = insertData && insertData.length > 0 ? insertData[0] : null;
        error = insertError;
      }

      if (error) {
        console.error('Error saving promotion:', error);
        alert('Erreur enregistrement: ' + error.message);
        return;
      }

      setShowForm(false);
      setForm({ id: null, code: '', discount: '', start_date: '', end_date: '', is_active: true });
      await load();
    } catch (e2) {
      console.error('Exception saving promotion:', e2);
      alert('Erreur enregistrement: ' + e2.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce code promo ?')) return;
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting promotion:', error);
        alert('Erreur suppression: ' + error.message);
        return;
      }

      await load();
    } catch (e) {
      console.error('Exception deleting promotion:', e);
      alert('Erreur suppression: ' + e.message);
    }
  };

  return (
    <section className="admin-card">
      <div className="admin-toolbar">
        <h2>Gestion des Promotions</h2>
        <div style={{display:'flex',gap:8}}>
          <button className="admin-crud-add-button" onClick={()=>setShowForm(true)}>+ Nouveau</button>
          <button className="admin-crud-add-button" onClick={load} disabled={loading}>{loading ? 'Chargement…' : 'Actualiser'}</button>
        </div>
      </div>

      {showForm && (
        <div className="admin-crud-form-overlay">
          <div className="admin-crud-form">
            <div className="admin-crud-form-header">
              <h3>{form.id ? 'Modifier' : 'Créer'} un code promo</h3>
              <button type="button" className="admin-crud-close-button" onClick={()=>setShowForm(false)}>×</button>
            </div>
            <form onSubmit={submit}>
              <div className="admin-crud-field">
                <label>Code</label>
                <input value={form.code} onChange={(e)=>setForm({...form, code:e.target.value})} required />
              </div>
              <div className="admin-crud-field">
                <label>Réduction (%)</label>
                <input type="number" min="1" max="100" value={form.discount} onChange={(e)=>setForm({...form, discount:e.target.value})} required />
              </div>
              <div className="admin-crud-field">
                <label>Date de début</label>
                <input type="date" value={form.start_date} onChange={(e)=>setForm({...form, start_date:e.target.value})} />
              </div>
              <div className="admin-crud-field">
                <label>Date de fin</label>
                <input type="date" value={form.end_date} onChange={(e)=>setForm({...form, end_date:e.target.value})} />
              </div>
              <div className="admin-crud-field">
                <label>
                  <input type="checkbox" checked={!!form.is_active} onChange={(e)=>setForm({...form, is_active:e.target.checked})} />
                  <span style={{marginLeft:8}}>Actif</span>
                </label>
              </div>
              <div className="admin-crud-form-actions">
                <button type="submit" className="admin-crud-save-button">{form.id ? 'Modifier' : 'Créer'}</button>
                <button type="button" className="admin-crud-cancel-button" onClick={()=>setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{overflow:'auto'}}>
        <table className="admin-table">
          <thead className="admin-thead">
            <tr>
              <th className="admin-th">Code</th>
              <th className="admin-th">% Réduction</th>
              <th className="admin-th">Début</th>
              <th className="admin-th">Fin</th>
              <th className="admin-th">Actif</th>
              <th className="admin-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td className="admin-td">{p.code}</td>
                <td className="admin-td">{p.discount}%</td>
                <td className="admin-td">{p.start_date || '-'}</td>
                <td className="admin-td">{p.end_date || '-'}</td>
                <td className="admin-td">{p.is_active ? 'Oui' : 'Non'}</td>
                <td className="admin-td">
                  <button className="admin-crud-edit-button" onClick={()=>{ setForm({ id:p.id, code:p.code, discount:p.discount, start_date:p.start_date || '', end_date:p.end_date || '', is_active:!!p.is_active }); setShowForm(true); }}>Modifier</button>
                  <button className="admin-crud-delete-button" onClick={()=>remove(p.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


