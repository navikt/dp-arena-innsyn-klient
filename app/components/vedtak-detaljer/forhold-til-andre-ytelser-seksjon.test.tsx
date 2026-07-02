// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ForholdTilAndreYtelserSeksjon } from 'components/sakogvedtakinfo/vedtakdetaljer/forhold-til-andre-ytelser-seksjon';
import { AndreYtelseDTO } from 'lib/services/arenaoppslag/arenaoppslag-types';

const lagYtelse = (overstyr: Partial<AndreYtelseDTO> = {}): AndreYtelseDTO => ({
  type: 'UFORETRYGD',
  belopPeriode: 'MND',
  grad: '50',
  belop: '1000',
  ...overstyr,
});

const lagYtelseMap = (...ytelser: AndreYtelseDTO[]): Map<string, AndreYtelseDTO> =>
  new Map(ytelser.map((y) => [y.type, y]));

const erMarkert = (tekst: string): boolean => {
  const verdi = screen.getByText(tekst);
  return /endret/.test(verdi.parentElement?.className ?? '');
};

describe('ForholdTilAndreYtelserSeksjon endringsmarkering', () => {
  it('markerer ingenting når det ikke finnes et relatert vedtak', () => {
    render(<ForholdTilAndreYtelserSeksjon andreYtelser={[lagYtelse()]} relatertAndreYtelserMap={null} />);

    expect(erMarkert('Uføretrygd')).toBe(false);
    expect(erMarkert('Måned')).toBe(false);
    expect(erMarkert('50%')).toBe(false);
  });

  it('markerer alle felter når ytelsestypen ikke finnes i relatert vedtak', () => {
    render(
      <ForholdTilAndreYtelserSeksjon
        andreYtelser={[lagYtelse()]}
        relatertAndreYtelserMap={lagYtelseMap(lagYtelse({ type: 'PLEIEPENGER' }))}
      />
    );

    expect(erMarkert('Uføretrygd')).toBe(true);
    expect(erMarkert('Måned')).toBe(true);
    expect(erMarkert('50%')).toBe(true);
  });

  it('markerer ingenting når ytelsen er uendret', () => {
    render(
      <ForholdTilAndreYtelserSeksjon andreYtelser={[lagYtelse()]} relatertAndreYtelserMap={lagYtelseMap(lagYtelse())} />
    );

    expect(erMarkert('Uføretrygd')).toBe(false);
    expect(erMarkert('Måned')).toBe(false);
    expect(erMarkert('50%')).toBe(false);
  });

  it('markerer kun feltet som er endret', () => {
    render(
      <ForholdTilAndreYtelserSeksjon
        andreYtelser={[lagYtelse({ grad: '50' })]}
        relatertAndreYtelserMap={lagYtelseMap(lagYtelse({ grad: '40' }))}
      />
    );

    expect(erMarkert('50%')).toBe(true);
    expect(erMarkert('Uføretrygd')).toBe(false);
    expect(erMarkert('Måned')).toBe(false);
  });

  it('skjuler Beløp når grad er satt og beløp er 0', () => {
    render(
      <ForholdTilAndreYtelserSeksjon
        andreYtelser={[lagYtelse({ grad: '50', belop: '0' })]}
        relatertAndreYtelserMap={null}
      />
    );

    expect(screen.queryByText('Beløp')).not.toBeInTheDocument();
  });

  it('viser Beløp når grad er satt og beløp er større enn 0', () => {
    render(
      <ForholdTilAndreYtelserSeksjon
        andreYtelser={[lagYtelse({ grad: '50', belop: '1000' })]}
        relatertAndreYtelserMap={null}
      />
    );

    expect(screen.getByText('Beløp')).toBeInTheDocument();
  });

  it('viser Beløp når grad er null og beløp er 0', () => {
    render(
      <ForholdTilAndreYtelserSeksjon
        andreYtelser={[lagYtelse({ grad: null, belop: '0' })]}
        relatertAndreYtelserMap={null}
      />
    );

    expect(screen.getByText('Beløp')).toBeInTheDocument();
  });
});
