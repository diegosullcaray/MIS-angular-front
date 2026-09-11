"""Inserta el capítulo 3 (markdown) dentro de una copia del TSP, con los estilos del documento."""
import copy
import io
import re
import sys

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def ancho_util(doc):
    """Ancho de página menos los márgenes de la sección: la figura no debe desbordar la caja de texto."""
    seccion = doc.sections[0]
    return seccion.page_width - seccion.left_margin - seccion.right_margin

ORIGEN = 'UNIVERSIDAD PERUANA DE CIENCIAS APLICADAS.docx'
DESTINO = 'UNIVERSIDAD PERUANA DE CIENCIAS APLICADAS - Cap3.docx'
FUENTE_MD = 'capitulo-3.md'


def bloques(md):
    """Markdown → lista de (tipo, dato). Tipos: h2, h3, p, bullet, num, tabla, cita."""
    salida = []
    lineas = md.split('\n')
    i = 0
    while i < len(lineas):
        l = lineas[i].rstrip()
        if not l.strip():
            i += 1
            continue
        if l.startswith('# '):          # el título del capítulo ya existe en el documento
            i += 1
            continue
        if l.startswith('#### '):
            salida.append(('h4', re.sub(r'^\d+(\.\d+)*\s+', '', l[5:].strip())))
        elif l.startswith('## '):
            salida.append(('h2', re.sub(r'^\d+(\.\d+)*\s+', '', l[3:].strip())))
        elif l.startswith('### '):
            salida.append(('h3', re.sub(r'^\d+(\.\d+)*\s+', '', l[4:].strip())))
        elif l.startswith('|'):
            filas = []
            while i < len(lineas) and lineas[i].strip().startswith('|'):
                fila = [c.strip() for c in lineas[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-{2,}:?', c) for c in fila):
                    filas.append(fila)
                i += 1
            salida.append(('tabla', filas))
            continue
        elif l.startswith('!['):
            salida.append(('imagen', re.search(r'\]\(([^)]+)\)', l).group(1)))
        elif l.startswith('> '):
            salida.append(('cita', l[2:].strip()))
        elif l.startswith('- '):
            salida.append(('bullet', l[2:].strip()))
        elif re.match(r'^\d+\.\s', l):
            # Se conserva el número: el estilo "List Paragraph" del documento no
            # trae numeración automática, así que sin esto la lista pierde el orden.
            salida.append(('num', l.strip()))
        else:
            salida.append(('p', l.strip()))
        i += 1
    return salida


def escribir_runs(parrafo, texto, italica_base=False):
    """Interpreta **negrita**, *itálica* y `código` en runs de Word."""
    for pieza in re.split(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)', texto):
        if not pieza:
            continue
        if pieza.startswith('**') and pieza.endswith('**'):
            r = parrafo.add_run(pieza[2:-2]); r.bold = True
        elif pieza.startswith('*') and pieza.endswith('*'):
            r = parrafo.add_run(pieza[1:-1]); r.italic = True
        elif pieza.startswith('`') and pieza.endswith('`'):
            r = parrafo.add_run(pieza[1:-1]); r.font.name = 'Consolas'
        else:
            r = parrafo.add_run(pieza)
        if italica_base:
            r.italic = True


def bordes(tabla):
    """Bordes visibles: el único estilo de tabla del documento no los trae."""
    tbl_pr = tabla._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for lado in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        e = OxmlElement(f'w:{lado}')
        e.set(qn('w:val'), 'single')
        e.set(qn('w:sz'), '4')
        e.set(qn('w:color'), '999999')
        borders.append(e)
    tbl_pr.append(borders)


def main():
    doc = docx.Document(ORIGEN)
    md = io.open(FUENTE_MD, encoding='utf-8').read()

    parrafos = doc.paragraphs
    inicio = next(i for i, p in enumerate(parrafos) if p.text.strip().startswith('CAPÍTULO 3'))
    fin = next(i for i, p in enumerate(parrafos) if p.text.strip() == 'CONCLUSIONES Y RECOMENDACIONES')

    ancla = parrafos[fin]._p                      # todo se inserta antes de este elemento
    for p in parrafos[inicio + 1:fin]:            # se limpian los encabezados vacíos del capítulo
        p._p.getparent().remove(p._p)

    cuerpo = doc.element.body

    def nuevo_parrafo(estilo):
        p = doc.add_paragraph(style=estilo)
        ancla.addprevious(p._p)
        return p

    for tipo, dato in bloques(md):
        if tipo in ('h2', 'h3', 'h4'):
            p = nuevo_parrafo({'h2': 'Heading 2', 'h3': 'Heading 3', 'h4': 'Heading 4'}[tipo])
            p.add_run(dato)
        elif tipo == 'bullet':
            p = nuevo_parrafo('List Paragraph')
            p.paragraph_format.left_indent = docx.shared.Cm(1)
            escribir_runs(p, '• ' + dato)
        elif tipo == 'num':
            p = nuevo_parrafo('List Paragraph')
            p.paragraph_format.left_indent = docx.shared.Cm(1)
            escribir_runs(p, dato)
        elif tipo == 'cita':
            p = nuevo_parrafo('Normal')
            escribir_runs(p, dato, italica_base=True)
        elif tipo == 'imagen':
            p = nuevo_parrafo('Normal')
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run().add_picture(dato, width=ancho_util(doc))
        elif tipo == 'tabla':
            filas = dato
            tabla = doc.add_table(rows=len(filas), cols=len(filas[0]))
            bordes(tabla)
            for f, fila in enumerate(filas):
                for c, celda in enumerate(fila):
                    if c >= len(tabla.columns):
                        continue
                    celda_doc = tabla.cell(f, c)
                    celda_doc.text = ''
                    escribir_runs(celda_doc.paragraphs[0], celda)
                    if f == 0:
                        for r in celda_doc.paragraphs[0].runs:
                            r.bold = True
            ancla.addprevious(tabla._tbl)
            vacia = nuevo_parrafo('Normal')       # separador después de la tabla
            vacia.add_run('')
        else:
            p = nuevo_parrafo('Normal')
            escribir_runs(p, dato)

    try:
        doc.save(DESTINO)
        print('generado:', DESTINO)
    except PermissionError:
        # El archivo suele quedar abierto en Word: se guarda al lado en vez de fallar.
        alterno = DESTINO.replace('.docx', ' (nuevo).docx')
        doc.save(alterno)
        print('generado:', alterno)
        print(f'  ({DESTINO} estaba abierto en Word; cerralo y renombrá este archivo)')


main()
