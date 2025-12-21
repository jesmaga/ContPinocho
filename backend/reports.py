import io
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as ReportLabImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from datetime import date
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import os
import sys

def generate_excel(transactions):
    """
    Generates an Excel file with detailed transactions.
    """
    data = []
    for t in transactions:
        data.append({
            "Fecha": t.fecha,
            "Concepto": t.concepto_original,
            "Categoría": t.categoria,
            "Tipo": t.tipo,
            "Importe": t.importe,
            "Curso Escolar": t.curso_escolar
        })
    
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Movimientos')
    
    output.seek(0)
    return output

import seaborn as sns

def generate_pie_chart(cat_stats):
    """
    Generates a clean pie chart with a lateral legend using professional colors.
    """
    cat_stats.sort(key=lambda x: x['amount'], reverse=True)
    
    if len(cat_stats) > 8:
        top_cats = cat_stats[:8]
        others = cat_stats[8:]
        other_sum = sum(c['amount'] for c in others)
        top_cats.append({'name': 'Otros', 'amount': other_sum})
        chart_data = top_cats
    else:
        chart_data = cat_stats

    labels = [f"{x['name']} ({x['amount']:,.0f}€)" for x in chart_data]
    sizes = [x['amount'] for x in chart_data]
    
    # Seaborn Style
    sns.set_theme(style="whitegrid", palette="pastel")
    
    plt.figure(figsize=(10, 5))
    
    # Custom Palette from Seaborn
    colors_list = sns.color_palette("pastel")
    
    patches, texts, autotexts = plt.pie(
        sizes, 
        startangle=90, 
        colors=colors_list,
        autopct='%1.1f%%',
        pctdistance=0.85,
        textprops={'fontsize': 9}
    )
    
    # Donut Style (Optional, looks modern) -> No, keeping it full pie for clarity as requested but clean
    # plt.axis('equal') 
    
    plt.title('Distribución de Gastos', fontsize=14, pad=20)
    
    # Legend outside
    plt.legend(patches, labels, loc="center left", bbox_to_anchor=(1, 0, 0.5, 1), frameon=False)
    
    plt.tight_layout()
    
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=150)
    plt.close()
    img_buffer.seek(0)
    return img_buffer

def generate_bar_chart(monthly_data):
    """
    Generates a grouped bar chart for Monthly Evolution with value labels.
    """
    sorted_keys = sorted(monthly_data.keys())
    
    months = sorted_keys
    incomes = [monthly_data[k]['ingreso'] for k in sorted_keys]
    expenses = [monthly_data[k]['gasto'] for k in sorted_keys]
    
    x = np.arange(len(months))
    width = 0.35
    
    sns.set_theme(style="white", palette="muted") # Cleaner background
    plt.figure(figsize=(10, 5))
    
    # Colors
    color_income = '#4ade80' # Soft Green
    color_expense = '#f87171' # Soft Red
    
    rects1 = plt.bar(x - width/2, incomes, width, label='Ingresos', color=color_income, edgecolor='white')
    rects2 = plt.bar(x + width/2, expenses, width, label='Gastos', color=color_expense, edgecolor='white')
    
    plt.title('Evolución Mensual: Ingresos vs Gastos', fontsize=14, pad=20)
    plt.xticks(x, months, rotation=45)
    plt.legend(frameon=False)
    
    # Remove Spines
    sns.despine(left=True)
    plt.grid(axis='y', linestyle=':', alpha=0.5)
    
    # Add Value Labels
    def add_labels(rects):
        for rect in rects:
            height = rect.get_height()
            if height > 0:
                plt.annotate(f'{height:,.0f}',
                            xy=(rect.get_x() + rect.get_width() / 2, height),
                            xytext=(0, 3),  # 3 points vertical offset
                            textcoords="offset points",
                            ha='center', va='bottom', fontsize=8, color="#555")

    add_labels(rects1)
    add_labels(rects2)
    
    plt.tight_layout()
    
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=150)
    plt.close()
    img_buffer.seek(0)
    return img_buffer

def generate_pdf(transactions, start_date, end_date):
    """
    Generates a professional PDF report with summaries and charts.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=20, alignment=1, spaceAfter=20)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, alignment=1, spaceAfter=30, textColor=colors.gray)
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=16, spaceBefore=15, spaceAfter=10, textColor=colors.HexColor('#1f2937'))
    
    # 1. Header with Logo
    # Load Logo
    import os
    import sys
    
    def resource_path(relative_path):
        try:
            base_path = sys._MEIPASS
        except Exception:
            base_path = os.path.abspath(".")
        return os.path.join(base_path, relative_path)

    logo_path = resource_path("static/assets/logo.png")
    
    if os.path.exists(logo_path):
        # Add Logo centered or left
        im = ReportLabImage(logo_path, width=4*cm, height=2*cm)
        im.hAlign = 'CENTER'
        elements.append(im)
        elements.append(Spacer(1, 10))
    
    elements.append(Paragraph("INFORME FINANCIERO", title_style))
    elements.append(Paragraph(f"Periodo: {start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}", subtitle_style))
    
    # 2. Logic: Strict Balance Calculation
    total_ingresos = sum(t.importe for t in transactions if t.tipo == 'INGRESO')
    # Use ABS for formatting Expenses as positive number
    total_gastos_abs = sum(abs(t.importe) for t in transactions if t.tipo == 'GASTO')
    net_balance = total_ingresos - total_gastos_abs
    
    # 3. Summary Table
    elements.append(Paragraph("Resumen Ejecutivo", h2_style))
    
    summary_data = [
        [
            f"INGRESOS\n+ {total_ingresos:,.2f} €",
            f"GASTOS\n{total_gastos_abs:,.2f} €", # Show as positive magnitude
            f"BALANCE\n{net_balance:,.2f} €"
        ]
    ]
    
    # Color logic for Balance Box
    balance_color = colors.green if net_balance >= 0 else colors.red
    
    t_summary = Table(summary_data, colWidths=[6*cm, 6*cm, 6*cm])
    t_summary.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 12),
        ('BOX', (0,0), (0,0), 2, colors.green),     # Income Box
        ('BOX', (1,0), (1,0), 2, colors.red),       # Expense Box
        ('BOX', (2,0), (2,0), 2, balance_color),    # Balance Box
        ('TEXTCOLOR', (0,0), (0,0), colors.green),
        ('TEXTCOLOR', (1,0), (1,0), colors.red),
        ('TEXTCOLOR', (2,0), (2,0), balance_color),
        ('TOPPADDING', (0,0), (-1,-1), 15),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f9fafb'))
    ]))
    elements.append(t_summary)
    elements.append(Spacer(1, 20))
    
    # 4. Monthly Evolution (Bar Chart)
    # Aggregate Data
    monthly_data = {}
    for t in transactions:
        key = t.fecha.strftime("%Y-%m")
        if key not in monthly_data: monthly_data[key] = {'ingreso': 0, 'gasto': 0}
        if t.tipo == "INGRESO":
            monthly_data[key]['ingreso'] += t.importe
        elif t.tipo == "GASTO":
            monthly_data[key]['gasto'] += abs(t.importe)
            
    if monthly_data:
        elements.append(Paragraph("Evolución Mensual", h2_style))
        bar_buffer = generate_bar_chart(monthly_data)
        elements.append(ReportLabImage(bar_buffer, width=16*cm, height=7*cm))
        elements.append(Spacer(1, 20))
        
    # 5. Pie Chart (Expenses)
    # Aggregate Data
    cat_expenses = {}
    for t in transactions:
        if t.tipo == 'GASTO':
            cat_expenses[t.categoria] = cat_expenses.get(t.categoria, 0) + abs(t.importe)
            
    if cat_expenses:
        elements.append(Paragraph("Distribución de Gastos", h2_style))
        chart_data_list = [{'name': k, 'amount': v} for k, v in cat_expenses.items()]
        pie_buffer = generate_pie_chart(chart_data_list)
        elements.append(ReportLabImage(pie_buffer, width=17*cm, height=8*cm))
        elements.append(Spacer(1, 20))
        
    # 6. Detailed Table
    elements.append(Paragraph("Desglose por Categorías", h2_style))
    
    # Prepare Table Data
    # Sort categories by absolute amount DESC
    all_cats = {}
    for t in transactions:
        if t.categoria not in all_cats:
            all_cats[t.categoria] = {'amount': 0.0, 'type': t.tipo}
            # Note: accumulating raw amount to determine net per category if mixed types exist?
            # Assuming Categories are single-type. But strict accumulation:
        
        # Accumulate raw amounts? 
        # If Logic is: GASTO = negative in DB.
        # Then just summing t.importe works for "Net per category".
        # But for display we want positive magnitude for expenses.
        current_type = all_cats[t.categoria]['type']
        if current_type == 'GASTO':
             all_cats[t.categoria]['amount'] += abs(t.importe)
        else:
             all_cats[t.categoria]['amount'] += t.importe
             
    # Convert to list
    cat_list = [{'name': k, 'amount': v['amount'], 'type': v['type']} for k, v in all_cats.items()]
    cat_list.sort(key=lambda x: x['amount'], reverse=True)
    
    table_data = [['Categoría', 'Tipo', 'Importe']]
    for c in cat_list:
        table_data.append([
            c['name'],
            c['type'],
            f"{c['amount']:,.2f} €"
        ])
        
    t_details = Table(table_data, colWidths=[10*cm, 4*cm, 4*cm])
    
    # Table Style
    t_style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e5e7eb')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
    ]
    
    # Conditional Text Colors
    for i, row in enumerate(table_data[1:], start=1):
        # row[1] is Type
        txt_color = colors.green if row[1] == 'INGRESO' else colors.red
        t_style_cmds.append(('TEXTCOLOR', (2, i), (2, i), txt_color))
        
    t_details.setStyle(TableStyle(t_style_cmds))
    elements.append(t_details)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
