import React, { useEffect, useState } from 'react';
import './AdminBebeEmployees.css';
import { supabase } from '../../lib/supabase';
import { LuEye, LuTrash2, LuX, LuRefreshCw, LuTriangleAlert } from 'react-icons/lu';

// Liste des employés bébé validés (status = 'approved')
export default function AdminBebeEmployeesValid({ token, onAuthError }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [selectedEmployee, setSelectedEmployee] = useState(null);

	const load = async () => {
		try {
			setLoading(true);
			setError('');

			const { data, error } = await supabase
				.from('bebe_employees')
				.select('*')
				.eq('status', 'approved')
				.order('created_at', { ascending: false });

			if (error) {
				console.error('[AdminBebeEmployeesValid] Error loading validated employees:', error);
				throw new Error(error.message || 'Impossible de charger les employés validés');
			}

			setItems(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e.message || 'Erreur de chargement');
		} finally {
			setLoading(false);
		}
	};

	useEffect(()=>{ load(); }, []);

	const remove = async (id) => {
		if (!window.confirm('Supprimer cet enregistrement validé ?')) return;
		try {
			const { error } = await supabase
				.from('bebe_employees')
				.delete()
				.eq('id', id);

			if (error) {
				console.error('[AdminBebeEmployeesValid] Error deleting validated employee:', error);
				alert(error.message || 'Erreur lors de la suppression');
				return;
			}

			setItems(prev => prev.filter(i => i.id !== id));
		} catch (e) {
			console.error('[AdminBebeEmployeesValid] Exception deleting validated employee:', e);
			alert(e.message || 'Erreur lors de la suppression');
		}
	};

	return (
		<main className="admin-page bebe-employees-page">
			<div className="bebe-employees-header">
				<h1>Employés Bébé Validés</h1>
				<div className="bebe-employees-actions">
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
								<th>#</th>
								<th>Nom</th>
								<th>Email</th>
								<th>Téléphone</th>
								<th>Expertise</th>
								<th>Ville</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{items.map(it => (
								<tr key={it.id}>
									<td>#{it.id}</td>
									<td>{`${it.first_name || ''} ${it.last_name || ''}`.trim() || '-'}</td>
									<td>
										<a href={`mailto:${it.email}`} className="bebe-employees-email">{it.email || '-'}</a>
									</td>
									<td>{it.phone || '-'}</td>
									<td>{it.expertise || '-'}</td>
									<td>{it.city || (it.address ? String(it.address).split(' - ')[0] : '') || '-'}</td>
									<td>
										<div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
											<button className="bebe-view-btn" onClick={() => setSelectedEmployee(it)} title="Voir détails">
												<LuEye className="icon" /> Voir
											</button>
											<button className="bebe-employees-delete-btn" onClick={()=>remove(it.id)}>
												<LuTrash2 className="icon" /> Supprimer
											</button>
										</div>
									</td>
								</tr>
							))}
							{items.length === 0 && (
								<tr>
									<td colSpan={7} className="bebe-employees-empty">Aucun employé validé trouvé</td>
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
										<span className="bebe-employees-status active">✓ Validé</span>
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


