import Barcode from 'react-barcode'
import type { Paquete } from '@/types/paquete'

interface EtiquetaPaqueteProps {
  paquete: Paquete
}

export default function EtiquetaPaquete({ paquete }: EtiquetaPaqueteProps) {

  // Construir dirección del destinatario
  const direccionDestinatario = [
    paquete.provinciaDestinatario,
    paquete.paisDestinatario,
    paquete.cantonDestinatario
  ].filter(Boolean).join(' - ')

  // Obtener información del cliente destinatario
  const nombreDestinatario = paquete.nombreClienteDestinatario || 'N/A'
  const direccionCompletaDestinatario = paquete.direccionDestinatarioCompleta || paquete.direccionDestinatario || 'N/A'
  const telefonoDestinatario = paquete.telefonoDestinatario || 'N/A'
  const documentoDestinatario = paquete.documentoDestinatario || 'N/A'
  const agenciaOficina = paquete.nombreAgenciaDestino || paquete.nombrePuntoOrigen || 'N/A'

  // Número de guía para el código de barras
  const numeroGuia = paquete.numeroGuia || paquete.idPaquete?.toString() || ''

  // Extraer agencia/oficina para mostrarla centrada
  const nombreAgencia = agenciaOficina && agenciaOficina !== 'N/A' ? agenciaOficina : null
  
  // Construir lista de elementos únicos para la sección derecha (sin duplicados)
  const elementosDerecha: Array<{ texto: string; esBold?: boolean }> = []
  
  // Agregar nombre destinatario si existe y no está duplicado
  if (nombreDestinatario && nombreDestinatario !== 'N/A' && 
      !elementosDerecha.some(e => e.texto === nombreDestinatario)) {
    elementosDerecha.push({ texto: nombreDestinatario })
  }
  
  // Agregar dirección completa si existe y no está duplicada (y no es igual a la dirección corta)
  if (direccionCompletaDestinatario && direccionCompletaDestinatario !== 'N/A' && 
      direccionCompletaDestinatario !== direccionDestinatario &&
      !elementosDerecha.some(e => e.texto === direccionCompletaDestinatario)) {
    elementosDerecha.push({ texto: direccionCompletaDestinatario })
  }
  
  // Agregar teléfono si existe y no está duplicado (y no está incluido en la dirección completa)
  if (telefonoDestinatario && telefonoDestinatario !== 'N/A' && 
      !elementosDerecha.some(e => e.texto === telefonoDestinatario || 
        (direccionCompletaDestinatario && direccionCompletaDestinatario.includes(telefonoDestinatario)))) {
    elementosDerecha.push({ texto: telefonoDestinatario })
  }
  
  // Agregar dirección del destinatario (Provincia - País - cantón) SOLO debajo del teléfono si existe y no está duplicada
  if (direccionDestinatario && direccionDestinatario.trim() !== '' && 
      !elementosDerecha.some(e => e.texto === direccionDestinatario || 
        e.texto.includes(direccionDestinatario) || direccionDestinatario.includes(e.texto))) {
    elementosDerecha.push({ texto: direccionDestinatario, esBold: true })
  }
  
  // Agregar documento si existe
  const documentoTexto = documentoDestinatario && documentoDestinatario !== 'N/A' 
    ? `c.i.: ${documentoDestinatario}` 
    : 'c.i.:'

  return (
    <div
      style={{
        width: '210mm',
        height: '49.5mm',
        border: '1px solid #000',
        padding: '4mm',
        display: 'flex',
        flexDirection: 'row',
        gap: '5mm',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Nombre de la agencia centrado entre las dos secciones */}
      {nombreAgencia && (
        <div
          style={{
            position: 'absolute',
            top: '2mm',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '13pt',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          {nombreAgencia}
        </div>
      )}

      {/* Sección izquierda */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {/* Código de barras */}
        <div
          style={{
            padding: '2mm 2mm 0 2mm',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {numeroGuia && (
            <div style={{ transform: 'scale(1.0)', transformOrigin: 'center', width: '100%', marginBottom: '0' }}>
              <Barcode
                value={numeroGuia}
                format="CODE128"
                width={3.3}
                height={67.5}
                displayValue={false}
              />
            </div>
          )}
        </div>
        {/* Número de guía debajo del código de barras */}
        {numeroGuia && (
          <div style={{ 
            fontSize: '32pt', 
            fontWeight: 'bold', 
            textAlign: 'center', 
            marginTop: '0',
            marginBottom: '0',
            width: '100%',
            padding: '0 2mm',
            letterSpacing: '0.5px',
            lineHeight: '1'
          }}>
            {numeroGuia}
          </div>
        )}
      </div>

      {/* Sección derecha */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', paddingLeft: '3mm', paddingTop: nombreAgencia ? '6mm' : '0', alignItems: 'center', textAlign: 'center' }}>
        {elementosDerecha.map((elemento, index) => {
          const isLast = index === elementosDerecha.length - 1 && documentoTexto === 'c.i.:'
          const isDireccionDestinatario = elemento.texto === direccionDestinatario && direccionDestinatario.trim() !== ''
          const marginBottom = elemento.esBold ? '3.5mm' : '2.5mm'
          const fontSize = isDireccionDestinatario ? '9.27pt' : (elemento.esBold ? '11pt' : '9pt') // 3% más grande: 9pt * 1.03 = 9.27pt
          
          return (
            <div
              key={index}
              style={{
                marginBottom: isLast ? '0' : marginBottom,
                marginTop: isLast && documentoTexto !== 'c.i.:' ? 'auto' : '0',
                fontSize: fontSize,
                fontWeight: isDireccionDestinatario ? 'bold' : (elemento.esBold ? 'bold' : 'normal'),
                textAlign: 'center',
                width: '100%',
              }}
            >
              {elemento.texto}
            </div>
          )
        })}
        
        {/* Cédula de provinciaanía destinatario */}
        <div style={{ marginTop: 'auto', fontSize: '9pt', textAlign: 'center', width: '100%' }}>
          {documentoTexto}
        </div>
      </div>
    </div>
  )
}
