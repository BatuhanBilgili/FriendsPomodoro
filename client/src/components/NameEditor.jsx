import { useState } from 'react';

export const NameEditor = ({ currentName, onSave, onCancel }) => {
	const [name, setName] = useState(currentName || '');

	const handleSubmit = (e) => {
		e.preventDefault();
		if (name.trim()) {
			onSave(name.trim());
		}
	};

	return (
		<div className="name-editor" onClick={onCancel}>
			<form
				className="name-editor-modal"
				onClick={e => e.stopPropagation()}
				onSubmit={handleSubmit}
			>
				<h2 className="name-editor-title">Edit Your Name</h2>
				<input
					type="text"
					className="name-editor-input"
					value={name}
					onChange={e => setName(e.target.value)}
					placeholder="Enter your name"
					maxLength={20}
					autoFocus
				/>
				<div className="name-editor-actions">
					<button
						type="button"
						className="name-editor-btn name-editor-btn--secondary"
						onClick={onCancel}
					>
						Cancel
					</button>
					<button
						type="submit"
						className="name-editor-btn name-editor-btn--primary"
					>
						Save
					</button>
				</div>
			</form>
		</div>
	);
};

export default NameEditor;
