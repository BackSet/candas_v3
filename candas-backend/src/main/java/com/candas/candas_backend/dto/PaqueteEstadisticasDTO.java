package com.candas.candas_backend.dto;


public class PaqueteEstadisticasDTO {
    private long total;
    private long registrados;
    private long recibidos;
    private long ensacados;
    private long despachados;

    public PaqueteEstadisticasDTO() {}

    public PaqueteEstadisticasDTO(long total, long registrados, long recibidos, long ensacados, long despachados) {
        this.total = total;
        this.registrados = registrados;
        this.recibidos = recibidos;
        this.ensacados = ensacados;
        this.despachados = despachados;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getRegistrados() {
        return registrados;
    }

    public void setRegistrados(long registrados) {
        this.registrados = registrados;
    }

    public long getRecibidos() {
        return recibidos;
    }

    public void setRecibidos(long recibidos) {
        this.recibidos = recibidos;
    }

    public long getEnsacados() {
        return ensacados;
    }

    public void setEnsacados(long ensacados) {
        this.ensacados = ensacados;
    }

    public long getDespachados() {
        return despachados;
    }

    public void setDespachados(long despachados) {
        this.despachados = despachados;
    }
}