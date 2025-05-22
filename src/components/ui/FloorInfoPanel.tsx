// src/components/FloorInfoPanel.tsx
'use client';
import React from 'react';
import styled from '@emotion/styled';
import { useCanvasStore } from '@/state/canvasStore';
import { useObjectStore } from '@/state/objectStore'; // де зберігаються ваші дані

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const Panel = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90%;
  overflow: auto;
  padding: 24px;
`;

const Close = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
`;

export default function FloorInfoPanel() {
  const isOpen = useCanvasStore(s => s.isInfoOpen);
  const toggle = useCanvasStore(s => s.toggleInfo);

  // Підтягуємо дані всіх елементів поверху
  const modules = useObjectStore(s => s.modules);
  const openings = useObjectStore(s => s.openings);
  const corridors = useObjectStore(s => s.corridors);

  if (!isOpen) return null;

  return (
    <Overlay onClick={toggle}>
      <Panel onClick={e => e.stopPropagation()}>
        <Close onClick={toggle}>&times;</Close>
        <h2>Floor Elements Info</h2>

        {/* Модулі */}
        <h3>Modules</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>W</th>
              <th>L</th>
              <th>H</th>
              <th>x0</th>
              <th>y0</th>
              <th>z_offset</th>
              <th>Rot</th>
              <th>Stack</th>
            </tr>
          </thead>
          <tbody>
            {modules.map(m => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.width}</td>
                <td>{m.length}</td>
                <td>{m.height}</td>
                <td>{m.x0}</td>
                <td>{m.y0}</td>
                <td>{m.zOffset}</td>
                <td>{m.rotation}</td>
                <td>{m.stackedFloors}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Openings */}
        <h3>Openings</h3>
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th>Side</th>
              <th>W</th>
              <th>H</th>
              <th>Dist</th>
              <th>y_off</th>
            </tr>
          </thead>
          <tbody>
            {openings.map(o => (
              <tr key={o.id}>
                <td>{modules ? modules.find(el => el.id === o.moduleId)?.name : ''}</td>
                <td>{o.wallSide}</td>
                <td>{o.width}</td>
                <td>{o.height}</td>
                <td>{o.distanceAlongWall}</td>
                <td>{o.yOffset}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Балкони */}
        {/*<h3>Balconies</h3>*/}
        {/*<table>*/}
        {/*  <thead>*/}
        {/*    <tr>*/}
        {/*      <th>ID</th>*/}
        {/*      <th>Module</th>*/}
        {/*      <th>Side</th>*/}
        {/*      <th>W</th>*/}
        {/*      <th>L</th>*/}
        {/*      <th>Dist</th>*/}
        {/*    </tr>*/}
        {/*  </thead>*/}
        {/*  <tbody>*/}
        {/*    {balconies.map(b => (*/}
        {/*      <tr key={b.id}>*/}
        {/*        <td>{b.name}</td>*/}
        {/*        <td>{b.moduleName}</td>*/}
        {/*        <td>{b.side}</td>*/}
        {/*        <td>{b.width}</td>*/}
        {/*        <td>{b.length}</td>*/}
        {/*        <td>{b.distance}</td>*/}
        {/*      </tr>*/}
        {/*    ))}*/}
        {/*  </tbody>*/}
        {/*</table>*/}

        {/*/!* Bathroom Pods *!/*/}
        {/*<h3>Bathroom Pods</h3>*/}
        {/*<table>*/}
        {/*  <thead>*/}
        {/*    <tr>*/}
        {/*      <th>ID</th>*/}
        {/*      <th>Module</th>*/}
        {/*      <th>W</th>*/}
        {/*      <th>L</th>*/}
        {/*      <th>x_off</th>*/}
        {/*      <th>y_off</th>*/}
        {/*    </tr>*/}
        {/*  </thead>*/}
        {/*  <tbody>*/}
        {/*    {bathroomPods.map(bp => (*/}
        {/*      <tr key={bp.id}>*/}
        {/*        <td>{bp.name}</td>*/}
        {/*        <td>{bp.moduleName}</td>*/}
        {/*        <td>{bp.width}</td>*/}
        {/*        <td>{bp.length}</td>*/}
        {/*        <td>{bp.xOffset}</td>*/}
        {/*        <td>{bp.yOffset}</td>*/}
        {/*      </tr>*/}
        {/*    ))}*/}
        {/*  </tbody>*/}
        {/*</table>*/}

        {/* Corridors */}
        <h3>Corridors</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Floor</th>
              <th>x1</th>
              <th>y1</th>
              <th>x2</th>
              <th>y2</th>
            </tr>
          </thead>
          <tbody>
            {corridors.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.floor}</td>
                <td>{c.x1}</td>
                <td>{c.y1}</td>
                <td>{c.x2}</td>
                <td>{c.y2}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Roofs */}
        {/*<h3>Roofs</h3>*/}
        {/*<table>*/}
        {/*  <thead>*/}
        {/*    <tr>*/}
        {/*      <th>Name</th>*/}
        {/*      <th>Dir</th>*/}
        {/*      <th>Type</th>*/}
        {/*      <th>Angle</th>*/}
        {/*      <th>Lvl</th>*/}
        {/*      <th>x1</th>*/}
        {/*      <th>y1</th>*/}
        {/*      <th>x2</th>*/}
        {/*      <th>y2</th>*/}
        {/*      <th>Parapet</th>*/}
        {/*    </tr>*/}
        {/*  </thead>*/}
        {/*  <tbody>*/}
        {/*    {roofs.map(r => (*/}
        {/*      <tr key={r.id}>*/}
        {/*        <td>{r.name}</td>*/}
        {/*        <td>{r.direction}</td>*/}
        {/*        <td>{r.type}</td>*/}
        {/*        <td>{r.angle}</td>*/}
        {/*        <td>{r.level}</td>*/}
        {/*        <td>{r.x1}</td>*/}
        {/*        <td>{r.y1}</td>*/}
        {/*        <td>{r.x2}</td>*/}
        {/*        <td>{r.y2}</td>*/}
        {/*        <td>{r.parapetHeight}</td>*/}
        {/*      </tr>*/}
        {/*    ))}*/}
        {/*  </tbody>*/}
        {/*</table>*/}
      </Panel>
    </Overlay>
  );
}
