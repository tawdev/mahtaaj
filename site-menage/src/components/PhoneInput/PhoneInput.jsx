import React, { useState, useRef, useEffect } from 'react';
import PhoneInput, { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import fr from 'react-phone-number-input/locale/fr.json';
import { FiSearch, FiChevronDown, FiCheck } from 'react-icons/fi';
import 'react-phone-number-input/style.css';
import './PhoneInput.css';

/**
 * Custom Country Selection Component with search and rich display.
 */
const CustomCountrySelect = ({ value, onChange, options, iconComponent: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    const countries = getCountries();

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option => {
        if (!option.value) return false;
        const countryLabel = fr[option.value] || option.label;
        const dialCode = getCountryCallingCode(option.value);
        return countryLabel.toLowerCase().includes(search.toLowerCase()) ||
            dialCode.includes(search);
    });

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="custom-country-select" ref={containerRef}>
            <button
                type="button"
                className="country-select-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="trigger-content">
                    {value && <Icon country={value} label={fr[value]} />}
                    <span className="selected-country-name">{value ? fr[value] : 'Select country'}</span>
                </div>
                <FiChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="country-dropdown">
                    <div className="search-container">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher un pays..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <ul className="country-list">
                        {filteredOptions.map((option) => (
                            <li
                                key={option.value}
                                className={`country-item ${option.value === value ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                            >
                                <div className="country-item-left">
                                    <Icon country={option.value} label={fr[option.value]} />
                                    <span className="country-name">{fr[option.value] || option.label}</span>
                                </div>
                                <div className="country-item-right">
                                    <span className="dial-code">+{getCountryCallingCode(option.value)}</span>
                                    {option.value === value && <FiCheck className="check-icon" />}
                                </div>
                            </li>
                        ))}
                        {filteredOptions.length === 0 && (
                            <li className="no-results">Aucun pays trouvé</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

const CustomPhoneInput = ({
    value,
    onChange,
    placeholder,
    defaultCountry = 'MA',
    className = ''
}) => {
    return (
        <div className={`custom-phone-input-container ${className}`}>
            <PhoneInput
                international
                defaultCountry={defaultCountry}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                smartCaret={false}
                countrySelectComponent={CustomCountrySelect}
                className="form-phone-input"
                numberInputProps={{
                    className: 'phone-number-input-field'
                }}
            />
        </div>
    );
};

export default CustomPhoneInput;
