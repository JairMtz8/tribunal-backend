-- seeds/catalogos_seeds.sql
-- Script para insertar datos iniciales en las tablas de catálogo

INSERT INTO rol (nombre, descripcion) VALUES
                                          ('Administrador', 'Tiene acceso a todo'),
                                          ('Juzgados','Tiene acceso a proceso CJ y CJO'),
                                          ('Juzgado de Ejecución','Tiene acceso a procesos CEMCI y CEMS');

INSERT INTO estado_procesal (nombre) VALUES
                                         ('Interno'),
                                         ('Externo'),
                                         ('Interno compurgado'),
                                         ('Externo compurgado'),
                                         ('Amparado'),
                                         ('Sustraido'),
                                         ('Suspendido'),
                                         ('Declinado'),
                                         ('Concluido'),
                                         ('Cambio de medida cautelar'),
                                         ('Interno compurgado anticipadamente'),
                                         ('Externo compurgado anticipadamente'),
                                         ('Externo sustraido'),
                                         ('Interno sustraido'),
                                         ('Interno amparado');

INSERT INTO status (nombre) VALUES
                                ('Post-Sancion'),
                                ('Activa'),
                                ('Concluida'),
                                ('Archivo'),
                                ('Reparacion del daño');

INSERT INTO tipo_medida_sancionadora (nombre, es_privativa) VALUES
                                                                ('Internamiento', TRUE),
                                                                ('Estancia domiciliaria', TRUE),
                                                                ('Semi internamiento', TRUE),
                                                                ('Libertad asistida', FALSE),
                                                                ('Prestación de servicios comunitarios', FALSE),
                                                                ('Supervisión familiar', FALSE),
                                                                ('Amonestación', FALSE),
                                                                ('Sesiones de asesoramiento', FALSE);

INSERT INTO tipo_medida_cautelar (nombre, genera_cemci) VALUES
                                                            ('Firma periódica', FALSE),
                                                            ('Porhibición de salir del pais o localidad', FALSE),
                                                            ('Someterse al cuidado o vigilancia', FALSE),
                                                            ('Prohibición de acercarse a ciertos lugares', FALSE),
                                                            ('Prohibición de comunicarse con las victimas, ofendidos o testigos', FALSE),
                                                            ('Separación inmediata del domicilio', FALSE),
                                                            ('Colocación de localizadores electrónicos', FALSE),
                                                            ('Garantía económica', FALSE),
                                                            ('Embargo de bienes', FALSE),
                                                            ('Inmovilización de cuentas', FALSE),
                                                            ('Resguardo en su domicilio', FALSE),
                                                            ('Libertad bajo simple promesa', FALSE),
                                                            ('Internamiento preventivo', TRUE);

INSERT INTO tipo_reparacion (nombre) VALUES
                                         ('Genérica'),
                                         ('Moral'),
                                         ('Integral'),
                                         ('N/A');