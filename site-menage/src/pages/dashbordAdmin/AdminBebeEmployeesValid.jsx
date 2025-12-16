import React, { useEffect, useState } from 'react';
import './AdminBebeEmployees.css';
import { supabase } from '../../lib/supabase';

// Liste des employés bébé validés (status = 'approved')
export default function AdminBebeEmployeesValid({ token, onAuthError }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

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
					<button className="bebe-employees-refresh-btn" onClick={load}>🔄 Rafraîchir</button>
				</div>
			</div>

			{error && <div className="bebe-employees-alert error">{error}</div>}
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
									<td>{it.email || '-'}</td>
									<td>{it.phone || '-'}</td>
									<td>{it.expertise || '-'}</td>
									<td>{it.location || '-'}</td>
									<td>
										<button className="bebe-employees-delete-btn" onClick={()=>remove(it.id)}>🗑️ Supprimer</button>
									</td>
								</tr>
							))}
							{items.length === 0 && (
								<tr><td colSpan={7} className="bebe-employees-empty">Aucun élément</td></tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</main>
	);
}


