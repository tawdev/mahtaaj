import React, { useEffect, useMemo, useState } from 'react';
import './AdminBebeEmployees.css';
import { supabase } from '../../lib/supabase';
import { LuEye, LuCheck, LuTrash2, LuX, LuRefreshCw, LuTriangleAlert } from 'react-icons/lu';

// NOTE:
// Cette version utilise directement Supabase (comme les autres pages admin)
// au lieu d'appeler l'ancienne API Laravel sur http://localhost:8000.

export default function AdminBebeEmployees({ token, onAuthError }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filter, setFilter] = useState('all');
	const [selectedEmployee, setSelectedEmployee] = useState(null);

	const load = async () => {
		try {
			setLoading(true);
			setError('');

			const { data, error } = await supabase
				.from('bebe_employees')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) {
				console.error('[AdminBebeEmployees] Error loading employees:', error);
				throw new Error(error.message || 'Impossible de charger les employés');
			}

			setItems(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e.message || 'Erreur de chargement');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); }, []);

	const filtered = useMemo(() => {
		if (filter === 'all') return items;
		if (filter === 'active') return items.filter(i => i.is_active);
		if (filter === 'inactive') return items.filter(i => !i.is_active);
		return items;
	}, [items, filter]);

	const toggleActive = async (id, next) => {
		try {
			const { error } = await supabase
				.from('bebe_employees')
				.update({
					is_active: !!next,
					status: next ? 'approved' : 'pending',
					updated_at: new Date().toISOString()
				})
				.eq('id', id);

			if (error) {
				console.error('[AdminBebeEmployees] Error toggling active:', error);
				alert(error.message || 'Erreur lors de la mise à jour du statut');
				return;
			}

			setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !!next, status: next ? 'approved' : 'pending' } : i));
		} catch (e) {
			console.error('[AdminBebeEmployees] Exception toggling active:', e);
			alert(e.message || 'Erreur lors de la mise à jour du statut');
		}
	};

	const remove = async (id) => {
		if (!window.confirm('Supprimer cet employé ?')) return;
		try {
			const { error } = await supabase
				.from('bebe_employees')
				.delete()
				.eq('id', id);

			if (error) {
				console.error('[AdminBebeEmployees] Error removing employee:', error);
				alert(error.message || 'Erreur lors de la suppression');
				return;
			}

			setItems(prev => prev.filter(i => i.id !== id));
		} catch (e) {
			console.error('[AdminBebeEmployees] Exception removing employee:', e);
			alert(e.message || 'Erreur lors de la suppression');
		}
	};

	const validateEmployee = async (id) => {
		try {
			// On considère qu'un employé validé est un employé avec status='approved' et is_active=true
			const { error } = await supabase
				.from('bebe_employees')
				.update({
					status: 'approved',
					is_active: true,
					updated_at: new Date().toISOString()
				})
				.eq('id', id);

			if (error) {
				console.error('[AdminBebeEmployees] Error validating employee:', error);
				alert(error.message || 'Validation échouée');
				return;
			}

			// Retirer de la liste "en attente" (comme avant)
			setItems(prev => prev.filter(i => i.id !== id));
			alert('Employé validé ✅');
		} catch (e) {
			console.error('[AdminBebeEmployees] Exception validating employee:', e);
			alert(e.message || 'Validation échouée');
		}
	};

	return (
		<main className="admin-page bebe-employees-page">
			<div className="bebe-employees-header">
				<h1>Employés Bébé</h1>
				<div className="bebe-employees-actions">
					<select 
						className="bebe-employees-filter"
						value={filter} 
						onChange={e=>setFilter(e.target.value)}
					>
						<option value="all">Tous</option>
						<option value="active">Actifs</option>
						<option value="inactive">Inactifs</option>
					</select>
					<button className="bebe-employees-refresh-btn" onClick={load}>
						<LuRefreshCw className="icon" /> Rafraîchir
					</button>
				</div>
			</div>

			{error && (
				<div className="bebe-employees-alert error">
					<LuTriangleAlert className="icon" />
					<span>{error}</span>
				</div>
			)}
			{loading ? (
				<div className="bebe-employees-loading">Chargement…</div>
			) : (
				<div className="bebe-employees-table-wrapper">
					<table className="bebe-employees-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Nom</th>
								<th>Email</th>
								<th>Téléphone</th>
								<th>Expertise</th>
								<th>Ville</th>
								<th>Quartier</th>
								<th>Statut</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map(emp => (
								<tr key={emp.id}>
									<td>#{emp.id}</td>
									<td>{`${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '-'}</td>
									<td>
										<a href={`mailto:${emp.email}`} className="bebe-employees-email">{emp.email || '-'}</a>
									</td>
									<td>{emp.phone || '-'}</td>
									<td>{emp.expertise || '-'}</td>
									<td>{emp.city || (emp.address ? String(emp.address).split(' - ')[0] : '') || '-'}</td>
									<td>{emp.quartier || (emp.address && String(emp.address).includes(' - ') ? String(emp.address).split(' - ')[1] : '') || '-'}</td>
									<td>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
											<input 
												type="checkbox" 
												className="bebe-employees-checkbox"
												checked={!!emp.is_active} 
												onChange={e=>toggleActive(emp.id, e.target.checked)} 
											/>
											<span className={`bebe-employees-status ${emp.is_active ? 'active' : 'inactive'}`}>
												{emp.is_active ? '✓ Actif' : '✗ Inactif'}
											</span>
										</div>
									</td>
									<td>
										<div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
											<button className="bebe-view-btn" onClick={() => setSelectedEmployee(emp)} title="Voir détails">
												<LuEye className="icon" /> Voir
											</button>
											<button className="bebe-employees-validate-btn" onClick={()=>validateEmployee(emp.id)}>
												<LuCheck className="icon" /> Valider
											</button>
											<button className="bebe-employees-delete-btn" onClick={()=>remove(emp.id)}>
												<LuTrash2 className="icon" /> Supprimer
											</button>
										</div>
									</td>
								</tr>
							))}
							{filtered.length === 0 && (
								<tr>
									<td colSpan={9} className="bebe-employees-empty">Aucun employé trouvé</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}

			{/* Employee Details Modal */}
			{selectedEmployee && (
				<div className="bebe-details-overlay" onClick={() => setSelectedEmployee(null)}>
					<div className="bebe-details-modal" onClick={e => e.stopPropagation()}>
						<div className="bebe-details-header">
							<h2>📄 Détails de l'employé</h2>
							<button className="bebe-details-close-btn" onClick={() => setSelectedEmployee(null)}>
								<LuX />
							</button>
						</div>
						<div className="bebe-details-content">
							<div className="bebe-profile-header">
								<img
									src={selectedEmployee.photo_url || selectedEmployee.photo || 'https://via.placeholder.com/150?text=No+Photo'}
									alt={`${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`}
									className="bebe-profile-image"
									onError={(e) => {
										e.target.onerror = null;
										e.target.src = 'https://via.placeholder.com/150?text=No+Photo';
									}}
								/>
								<div className="bebe-profile-info">
									<h3 className="bebe-profile-name">{`${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim() || 'Sans Nom'}</h3>
									<div className="bebe-profile-category">Garde d'enfants / Baby-sitting</div>
									<div className="bebe-profile-status-wrapper">
										<span className={`bebe-employees-status ${selectedEmployee.is_active ? 'active' : 'inactive'}`}>
											{selectedEmployee.is_active ? '✓ Actif' : '✗ Inactif'}
										</span>
									</div>
								</div>
							</div>

							<div className="bebe-info-grid">
								<div className="bebe-info-item">
									<span className="bebe-info-label">Email</span>
									<span className="bebe-info-value">{selectedEmployee.email || '-'}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Téléphone</span>
									<span className="bebe-info-value">{selectedEmployee.phone || '-'}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Ville</span>
									<span className="bebe-info-value">{selectedEmployee.city || '-'}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Quartier</span>
									<span className="bebe-info-value">{selectedEmployee.quartier || '-'}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Adresse</span>
									<span className="bebe-info-value">{selectedEmployee.address || '-'}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Expertise</span>
									<span className="bebe-info-value">{selectedEmployee.expertise || '-'}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Âge</span>
									<span className="bebe-info-value">{selectedEmployee.age ? `${selectedEmployee.age} ans` : (selectedEmployee.birth_date ? `${new Date().getFullYear() - new Date(selectedEmployee.birth_date).getFullYear()} ans` : '-')}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Date de naissance</span>
									<span className="bebe-info-value">{selectedEmployee.birth_date ? new Date(selectedEmployee.birth_date).toLocaleDateString() : '-'}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Auto-entrepreneur</span>
									<span className="bebe-info-value">{selectedEmployee.auto_entrepreneur || '-'}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Dernière expérience</span>
									<span className="bebe-info-value">{selectedEmployee.last_experience || '-'}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Entreprise</span>
									<span className="bebe-info-value">{selectedEmployee.company_name || '-'}</span>
								</div>
								<div className="bebe-info-item">
									<span className="bebe-info-label">Horaires préférés</span>
									<span className="bebe-info-value">{selectedEmployee.preferred_work_time || '-'}</span>
								</div>
							</div>

							<div className="bebe-bio-section">
								<h3>Biographie / Description</h3>
								<div className="bebe-bio-text">
									{selectedEmployee.bio || 'Aucune description / biographie disponible.'}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}


