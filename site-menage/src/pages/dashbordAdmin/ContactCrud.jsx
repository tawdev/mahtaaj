import React, { useState, useEffect } from 'react';
import { getContactsAdmin, createContactAdmin, updateContactAdmin, deleteContactAdmin } from '../../api-supabase';
import './ContactCrud.css';

export default function ContactCrud({ token }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({ 
    firstname: '', 
    phone: '', 
    location: '', 
    service: '', 
    message: '' 
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await getContactsAdmin(token);
      setContacts(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setError('Impossible de charger les contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await updateContactAdmin(token, editingContact.id, formData);
      } else {
        await createContactAdmin(token, formData);
      }
      setShowForm(false);
      setEditingContact(null);
      setFormData({ firstname: '', phone: '', location: '', service: '', message: '' });
      loadContacts();
    } catch (e) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      firstname: contact.firstname || '',
      phone: contact.phone || '',
      location: contact.location || '',
      service: contact.service || '',
      message: contact.message || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }
    try {
      await deleteContactAdmin(token, id);
      loadContacts();
    } catch (e) {
      setError(e.message || 'Erreur lors de la suppression');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingContact(null);
    setFormData({ firstname: '', phone: '', location: '', service: '', message: '' });
  };

  if (loading) return <div className="contact-crud-loading">Chargement...</div>;
  if (error) return <div className="contact-crud-error">{error}</div>;

  return (
    <div className="contact-crud">
      <div className="contact-crud-header">
        <h2>Gestion des Contacts</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="contact-crud-add-button"
        >
          + Nouveau Contact
        </button>
      </div>

      {showForm && (
        <div className="contact-crud-form-overlay">
          <div className="contact-crud-form">
            <h3>{editingContact ? 'Modifier' : 'Créer'} un Contact</h3>
            <form onSubmit={handleSubmit}>
              <div className="contact-crud-field">
                <label htmlFor="firstname">Prénom *</label>
                <input
                  id="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                  required
                  placeholder="Prénom"
                />
              </div>
              
              <div className="contact-crud-field">
                <label htmlFor="phone">Téléphone *</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  placeholder="+212 6 12 34 56 78"
                />
              </div>
              
              <div className="contact-crud-field">
                <label htmlFor="location">Lieu *</label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                  placeholder="Ville / Adresse"
                />
              </div>
              
              <div className="contact-crud-field">
                <label htmlFor="service">Service *</label>
                <select
                  id="service"
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  required
                >
                  <option value="">Choisir un service</option>
                  <option value="Ménage à domicile">Ménage à domicile</option>
                  <option value="Nettoyage de bureaux">Nettoyage de bureaux</option>
                  <option value="Lavage de vitres">Lavage de vitres</option>
                  <option value="Repassage">Repassage</option>
                  <option value="Nettoyage Canapé">Nettoyage Canapé</option>
                </select>
              </div>
              
              <div className="contact-crud-field">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                  rows="4"
                  placeholder="Décrivez la prestation..."
                />
              </div>
              
              <div className="contact-crud-form-actions">
                <button type="submit" className="contact-crud-save-button">
                  {editingContact ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" onClick={handleCancel} className="contact-crud-cancel-button">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="contact-crud-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Prénom</th>
              <th>Téléphone</th>
              <th>Lieu</th>
              <th>Service</th>
              <th>Message</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>{contact.id}</td>
                <td>{contact.firstname}</td>
                <td>{contact.phone}</td>
                <td>{contact.location}</td>
                <td>
                  <span className="contact-crud-badge">{contact.service}</span>
                </td>
                <td>
                  <div className="contact-crud-message" title={contact.message}>
                    {contact.message?.substring(0, 50)}...
                  </div>
                </td>
                <td>{new Date(contact.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => handleEdit(contact)}
                    className="contact-crud-edit-button"
                  >
                    Modifier
                  </button>
                  <button 
                    onClick={() => handleDelete(contact.id)}
                    className="contact-crud-delete-button"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
