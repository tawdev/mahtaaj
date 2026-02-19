import React, { useEffect, useMemo, useState } from 'react';
import './AdminHandWorkerEmployees.css';
import { supabase } from '../../lib/supabase';

export default function AdminHandWorkerEmployees({ token, onAuthError }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filter, setFilter] = useState('all');


	const load = async () => {
		try {
			setLoading(true);
			setError('');

			console.log('[AdminHandWorkerEmployees] Loading registrations from hand_worker_employees table');

			// Load hand_worker_employees with category join
			const { data, error } = await supabase
				.from('hand_worker_employees')
				.select(`
					*,
					hand_worker_categories:category_id (
						id,
						name,
						name_ar,
						name_fr,
						name_en
					)
				`)
				.order('created_at', { ascending: false });

			if (error) {
				console.error('[AdminHandWorkerEmployees] Error loading registrations:', error);
				setError('Erreur lors du chargement: ' + error.message);
				return;
			}

			// Transform data to match expected format
			const transformedData = (data || []).map(item => {
				const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
				const bio = item.bio || '';
				const shortBio = bio.length > 120 ? `${bio.slice(0, 117)}...` : bio;

				return {
					id: item.id,
					first_name: item.first_name || '',
					last_name: item.last_name || '',
					full_name: fullName || '-',
					email: item.email || '-',
					phone: item.phone || '-',
					category: item.hand_worker_categories ? {
						name: item.hand_worker_categories.name ||
							item.hand_worker_categories.name_fr ||
							item.hand_worker_categories.name_ar ||
							item.hand_worker_categories.name_en || '-'
					} : null,
					city: item.city || '-',
					quartier: item.quartier || '-',
					address: item.address || '-',
					bio,
					bio_short: shortBio,
					photo: item.photo || item.photo_url || '',
					experience_years: item.experience_years || 0,
					employee_type: item.employee_type || '-',
					status: item.status === 'active' ? 'approved' : (item.status === 'inactive' ? 'rejected' : (item.status || 'pending')),
					is_available: item.is_available || false,
					...item
				};
			});

			console.log('[AdminHandWorkerEmployees] Loaded registrations:', transformedData.length);
			setItems(transformedData);
		} catch (e) {
			console.error('[AdminHandWorkerEmployees] Exception loading registrations:', e);
			setError('Erreur de connexion: ' + e.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); }, []);

	const filtered = useMemo(() => {
		if (filter === 'all') return items;
		if (filter === 'pending') return items.filter(i => i.status === 'pending');
		if (filter === 'approved') return items.filter(i => i.status === 'approved');
		if (filter === 'rejected') return items.filter(i => i.status === 'rejected');
		return items;
	}, [items, filter]);

	const approveRegistration = async (id) => {
		try {
			console.log('[AdminHandWorkerEmployees] Approving registration:', id);

			// First, get the employee data
			const { data: employee, error: fetchError } = await supabase
				.from('hand_worker_employees')
				.select('*')
				.eq('id', id)
				.single();

			if (fetchError || !employee) {
				console.error('[AdminHandWorkerEmployees] Error fetching employee:', fetchError);
				alert('Erreur lors de la récupération des données: ' + (fetchError?.message || 'Employé non trouvé'));
				return;
			}

			// Insert into hand_worker_employees_valid table
			const { error: insertError } = await supabase
				.from('hand_worker_employees_valid')
				.insert([{
					employee_id: employee.id,
					first_name: employee.first_name,
					last_name: employee.last_name,
					email: employee.email,
					phone: employee.phone,
					category_id: employee.category_id,
					address: employee.address,
					city: employee.city,
					photo: employee.photo,
					photo_url: employee.photo_url,
					bio: employee.bio,
					experience_years: employee.experience_years,
					employee_type: employee.employee_type,
					is_available: true
				}]);

			if (insertError) {
				console.error('[AdminHandWorkerEmployees] Error inserting into valid table:', insertError);
				alert('Erreur lors de l\'insertion dans la table validée: ' + insertError.message);
				return;
			}

			// Update the original employee record
			const { error: updateError } = await supabase
				.from('hand_worker_employees')
				.update({
					status: 'active',
					is_available: true,
					updated_at: new Date().toISOString()
				})
				.eq('id', id);

			if (updateError) {
				console.error('[AdminHandWorkerEmployees] Error updating employee:', updateError);
				alert('Erreur lors de la mise à jour: ' + updateError.message);
				return;
			}

			// Update local state
			setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'approved', is_available: true } : i));
			alert('Inscription approuvée ✅');
		} catch (e) {
			console.error('[AdminHandWorkerEmployees] Exception approving registration:', e);
			alert('Erreur: ' + e.message);
		}
	};

	const rejectRegistration = async (id) => {
		if (!window.confirm('Rejeter cette inscription ?')) return;
		try {
			console.log('[AdminHandWorkerEmployees] Rejecting registration:', id);

			const { error } = await supabase
				.from('hand_worker_employees')
				.update({
					status: 'inactive',
					is_available: false,
					updated_at: new Date().toISOString()
				})
				.eq('id', id);

			if (error) {
				console.error('[AdminHandWorkerEmployees] Error rejecting registration:', error);
				alert('Erreur lors du rejet: ' + error.message);
				return;
			}

			// Update local state
			setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'rejected', is_available: false } : i));
			alert('Inscription rejetée');
		} catch (e) {
			console.error('[AdminHandWorkerEmployees] Exception rejecting registration:', e);
			alert('Erreur: ' + e.message);
		}
	};

	const remove = async (id) => {
		if (!window.confirm('Supprimer cette inscription ?')) return;
		try {
			console.log('[AdminHandWorkerEmployees] Deleting registration:', id);

			const { error } = await supabase
				.from('hand_worker_employees')
				.delete()
				.eq('id', id);

			if (error) {
				console.error('[AdminHandWorkerEmployees] Error deleting registration:', error);
				alert('Erreur lors de la suppression: ' + error.message);
				return;
			}

			// Update local state
			setItems(prev => prev.filter(i => i.id !== id));
			alert('Inscription supprimée');
		} catch (e) {
			console.error('[AdminHandWorkerEmployees] Exception deleting registration:', e);
			alert('Erreur: ' + e.message);
		}
	};

	/* Add state for viewing employee */
	const [selectedEmployee, setSelectedEmployee] = useState(null);

	const handleView = (employee) => {
		setSelectedEmployee(employee);
	};

	return (
		<main className="admin-page handworker-employees-page">
			<div className="handworker-employees-header">
				<h1>Employés Travaux Manuels</h1>
				<div className="handworker-employees-actions">
					<select
						className="handworker-employees-filter"
						value={filter}
						onChange={e => setFilter(e.target.value)}
					>
						<option value="all">Tous</option>
						<option value="pending">En attente</option>
						<option value="approved">Approuvés</option>
						<option value="rejected">Rejetés</option>
					</select>
					<button className="handworker-employees-refresh-btn" onClick={load}>🔄 Rafraîchir</button>
				</div>
			</div>

			{error && (
				<div className="handworker-employees-alert error">
					<span>⚠️</span>
					<span>{error}</span>
				</div>
			)}
			{loading ? (
				<div className="handworker-employees-loading">Chargement…</div>
			) : (
				<div className="handworker-employees-table-wrapper">
					<table className="handworker-employees-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Nom</th>
								<th>Email</th>
								<th>Téléphone</th>
								<th>Catégorie</th>
								<th>Ville</th>
								<th>Quartier</th>
								<th>Expérience</th>
								<th>نوع العامل</th>
								<th>Bio</th>
								<th>Statut</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map(emp => (
								<tr key={emp.id}>
									<td>#{emp.id}</td>
									<td>{emp.full_name || '-'}</td>
									<td>
										<a href={`mailto:${emp.email}`} className="handworker-employees-email">{emp.email || '-'}</a>
									</td>
									<td>{emp.phone || '-'}</td>
									<td>{emp.category?.name || '-'}</td>
									<td>{emp.city || '-'}</td>
									<td>{emp.quartier || '-'}</td>
									<td>{emp.experience_years || 0} ans</td>
									<td>{emp.employee_type || '-'}</td>
									<td style={{ maxWidth: '260px' }}>{emp.bio_short || '-'}</td>
									<td>
										<span className={`handworker-employees-status ${emp.status || 'pending'}`}>
											{emp.status === 'pending' ? '⏳ En attente' :
												emp.status === 'approved' ? '✓ Approuvé' :
													emp.status === 'rejected' ? '✗ Rejeté' : 'Inconnu'}
										</span>
									</td>
									<td>
										<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
											<button className="handworker-view-btn" onClick={() => handleView(emp)} title="Voir détails">👁️ Voir</button>
											{emp.status === 'pending' && (
												<button className="handworker-employees-approve-btn" onClick={() => approveRegistration(emp.id)} title="Valider">✅ Valider</button>
											)}
											{emp.status === 'pending' && (
												<button className="handworker-employees-reject-btn" onClick={() => rejectRegistration(emp.id)} title="Rejeter">❌ Rejeter</button>
											)}
											<button className="handworker-employees-delete-btn" onClick={() => remove(emp.id)} title="Supprimer">🗑️ Supprimer</button>
										</div>
									</td>
								</tr>
							))}
							{filtered.length === 0 && (
								<tr>
									<td colSpan={12} className="handworker-employees-empty">Aucune inscription trouvée</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}

			{/* Employee Details Modal */}
			{selectedEmployee && (
				<div className="handworker-details-overlay" onClick={() => setSelectedEmployee(null)}>
					<div className="handworker-details-modal" onClick={e => e.stopPropagation()}>
						<div className="handworker-details-header">
							<h2>
								📄 Détails de l'employé
							</h2>
							<button className="handworker-details-close-btn" onClick={() => setSelectedEmployee(null)}>
								✕
							</button>
						</div>
						<div className="handworker-details-content">
							<div className="handworker-profile-header">
								<img
									src={selectedEmployee.photo_url || selectedEmployee.photo || 'https://via.placeholder.com/150?text=No+Photo'}
									alt={selectedEmployee.full_name}
									className="handworker-profile-image"
									onError={(e) => {
										e.target.onerror = null;
										e.target.src = 'https://via.placeholder.com/150?text=No+Photo';
									}}
								/>
								<div className="handworker-profile-info">
									<h3 className="handworker-profile-name">{selectedEmployee.full_name}</h3>
									<div className="handworker-profile-category">
										{selectedEmployee.category?.name || 'Non catégorisé'}
									</div>
									<div className="handworker-profile-status-wrapper">
										<span className={`handworker-employees-status ${selectedEmployee.status || 'pending'}`}>
											{selectedEmployee.status === 'pending' ? '⏳ En attente' :
												selectedEmployee.status === 'approved' ? '✓ Approuvé' :
													selectedEmployee.status === 'rejected' ? '✗ Rejeté' : 'Inconnu'}
										</span>
									</div>
								</div>
							</div>

							<div className="handworker-info-grid">
								<div className="handworker-info-item">
									<span className="handworker-info-label">Email</span>
									<span className="handworker-info-value">{selectedEmployee.email || '-'}</span>
								</div>
								<div className="handworker-info-item">
									<span className="handworker-info-label">Téléphone</span>
									<span className="handworker-info-value">{selectedEmployee.phone || '-'}</span>
								</div>
								<div className="handworker-info-item">
									<span className="handworker-info-label">Ville</span>
									<span className="handworker-info-value">{selectedEmployee.city || '-'}</span>
								</div>
								<div className="handworker-info-item">
									<span className="handworker-info-label">Quartier</span>
									<span className="handworker-info-value">{selectedEmployee.quartier || '-'}</span>
								</div>
								<div className="handworker-info-item">
									<span className="handworker-info-label">Adresse</span>
									<span className="handworker-info-value">{selectedEmployee.address || '-'}</span>
								</div>
								<div className="handworker-info-item">
									<span className="handworker-info-label">Années d'expérience</span>
									<span className="handworker-info-value">{selectedEmployee.experience_years} ans</span>
								</div>
								<div className="handworker-info-item">
									<span className="handworker-info-label">Type d'employé</span>
									<span className="handworker-info-value">{selectedEmployee.employee_type || '-'}</span>
								</div>
								<div className="handworker-info-item">
									<span className="handworker-info-label">Date d'inscription</span>
									<span className="handworker-info-value">
										{selectedEmployee.created_at ? new Date(selectedEmployee.created_at).toLocaleDateString() : '-'}
									</span>
								</div>
							</div>

							<div className="handworker-bio-section">
								<h3>Biographie / Description</h3>
								<div className="handworker-bio-text">
									{selectedEmployee.bio || 'Aucune description fournie.'}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}

