import { useState, type FormEvent } from 'react';
import type { Club } from '../../shared/api/contracts';
import { Field } from '../../shared/components/Field';
import { Icon } from '../../shared/components/Icon';
import { initialFilters, type PlayerFilters } from './players.api';

const sortOptions = [
  ['name', 'Nome'],
  ['value_asc', 'Valor de mercado: menor primeiro'],
  ['value_desc', 'Valor de mercado: maior primeiro'],
  ['age_asc', 'Idade: menor primeiro'],
  ['age_desc', 'Idade: maior primeiro'],
  ['position', 'Posição'],
];

export function PlayerFiltersForm({
  clubs,
  onApply,
}: {
  clubs: Club[];
  onApply: (filters: PlayerFilters) => void;
}) {
  const [filters, setFilters] = useState(initialFilters);

  function update(key: keyof PlayerFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'free' && value === 'true' ? { clubId: '' } : {}),
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply(filters);
  }

  return (
    <form className="filters" onSubmit={submit} aria-label="Filtros de jogadores">
      <div className="filters-main">
        <Field id="search" label="Buscar por nome">
          <div className="input-icon">
            <Icon name="search" />
            <input
              id="search"
              value={filters.search}
              minLength={2}
              maxLength={100}
              placeholder="Ex.: João"
              onChange={(event) => update('search', event.target.value)}
            />
          </div>
        </Field>
        <Field id="position" label="Posição">
          <div className="input-icon">
            <Icon name="filter-position" />
            <select
              id="position"
              value={filters.position}
              onChange={(event) => update('position', event.target.value)}
            >
              <option value="">Todas</option>
              <option value="GOL">Goleiro</option>
              <option value="ZAG">Zagueiro</option>
              <option value="LAT">Lateral</option>
              <option value="MEI">Meio-campo</option>
              <option value="ATA">Atacante</option>
            </select>
          </div>
        </Field>
        <Field id="condition" label="Condição">
          <div className="input-icon">
            <Icon name="filter-condition" />
            <select
              id="condition"
              value={filters.condition}
              onChange={(event) => update('condition', event.target.value)}
            >
              <option value="">Todas</option>
              <option value="APTO">Apto</option>
              <option value="MAL_CONDICIONADO">Mal condicionado</option>
              <option value="DOENTE">Doente</option>
            </select>
          </div>
        </Field>
        <Field id="club" label="Clube">
          <div className="input-icon">
            <Icon name="filter-club" />
            <select
              id="club"
              value={filters.clubId}
              disabled={filters.free === 'true'}
              aria-describedby={filters.free === 'true' ? 'free-help' : undefined}
              onChange={(event) => update('clubId', event.target.value)}
            >
              <option value="">Todos</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>
        </Field>
      </div>
      <details className="advanced-filters">
        <summary>Vínculo, idade, valor de mercado e ordenação</summary>
        <div className="filters-secondary">
          <Field id="free" label="Vínculo">
            <select
              id="free"
              value={filters.free}
              onChange={(event) => update('free', event.target.value)}
            >
              <option value="">Todos os jogadores</option>
              <option value="true">Só livres</option>
              <option value="false">Em clubes</option>
            </select>
          </Field>
          <Field id="min-age" label="Idade mínima">
            <div className="input-icon">
              <Icon name="filter-age" />
              <input
                id="min-age"
                type="number"
                min="16"
                max="45"
                step="1"
                value={filters.minAge}
                onChange={(event) => update('minAge', event.target.value)}
              />
            </div>
          </Field>
          <Field id="max-age" label="Idade máxima">
            <input
              id="max-age"
              type="number"
              min="16"
              max="45"
              step="1"
              value={filters.maxAge}
              onChange={(event) => update('maxAge', event.target.value)}
            />
          </Field>
          <Field id="min-value" label="Valor mínimo">
            <div className="input-icon">
              <Icon name="filter-value" />
              <input
                id="min-value"
                type="number"
                min="0"
                max="550"
                step="0.01"
                value={filters.minValue}
                onChange={(event) => update('minValue', event.target.value)}
              />
            </div>
          </Field>
          <Field id="max-value" label="Valor máximo">
            <input
              id="max-value"
              type="number"
              min="0"
              max="550"
              step="0.01"
              value={filters.maxValue}
              onChange={(event) => update('maxValue', event.target.value)}
            />
          </Field>
          <Field id="sort" label="Ordenação">
            <div className="input-icon">
              <Icon name="sort" />
              <select
                id="sort"
                value={filters.sort}
                onChange={(event) => update('sort', event.target.value)}
              >
                {sortOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </div>
      </details>
      <div className="filter-actions">
        <span id="free-help" className="muted">
          {filters.free === 'true'
            ? 'Só livres: o filtro por clube fica desabilitado.'
            : 'Combine os filtros e aplique para consultar a API.'}
        </span>
        <button
          className="button button-ghost"
          type="button"
          onClick={() => {
            setFilters(initialFilters);
            onApply(initialFilters);
          }}
        >
          Limpar filtros
        </button>
        <button className="button button-outline" type="submit">
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}
