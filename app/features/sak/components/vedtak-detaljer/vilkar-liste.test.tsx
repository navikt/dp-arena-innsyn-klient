// // @vitest-environment happy-dom
// import { describe, it, expect } from 'vitest';
// import { render, screen } from '@testing-library/react';
// import { VilkarListe } from 'components/sakogvedtakinfo/vedtakdetaljer/vilkar-liste';
// import { VilkårsvurderingDTO } from 'lib/services/arenaoppslag/arenaoppslag-types';
//
// const lagVilkar = (id: number, statuskode: 'J' | 'N' | 'V', vilkårnavn: string): VilkårsvurderingDTO => ({
//   vilkårsvurderingId: id,
//   vilkårkode: `KODE_${id}`,
//   vilkårnavn,
//   statuskode,
//   statusnavn: statuskode === 'J' ? 'Ja' : statuskode === 'N' ? 'Nei' : 'Ikke vurdert',
//   vurdertAv: statuskode !== 'V' ? 'SAK1234' : null,
//   erObligatorisk: true,
//   begrunnelse: null,
//   hjelpetekstUrl: null,
//   lovtekstUrl: null,
//   rundskrivUrl: null,
// });
//
// describe('VilkarListe', () => {
//   it('skal sortere vilkår i rekkefølgen J, N, V', () => {
//     const vilkar = [
//       lagVilkar(1, 'V', 'Ikke vurdert vilkår'),
//       lagVilkar(2, 'N', 'Avslått vilkår'),
//       lagVilkar(3, 'J', 'Innvilget vilkår'),
//     ];
//
//     render(<VilkarListe vilkarsvurderinger={vilkar} />);
//
//     const labels = screen.getAllByText(/vilkår/i);
//     expect(labels[0]).toHaveTextContent('Innvilget vilkår');
//     expect(labels[1]).toHaveTextContent('Avslått vilkår');
//     expect(labels[2]).toHaveTextContent('Ikke vurdert vilkår');
//   });
//
//   it('skal beholde rekkefølgen innad i samme statuskode', () => {
//     const vilkar = [lagVilkar(1, 'J', 'Første J'), lagVilkar(2, 'V', 'Første V'), lagVilkar(3, 'J', 'Andre J')];
//
//     render(<VilkarListe vilkarsvurderinger={vilkar} />);
//
//     const labels = screen.getAllByText(/J$|V$/);
//     expect(labels[0]).toHaveTextContent('Første J');
//     expect(labels[1]).toHaveTextContent('Andre J');
//     expect(labels[2]).toHaveTextContent('Første V');
//   });
//
//   it('skal rendre tom liste uten feil', () => {
//     const { container } = render(<VilkarListe vilkarsvurderinger={[]} />);
//     expect(container.firstChild).toBeEmptyDOMElement();
//   });
// });
