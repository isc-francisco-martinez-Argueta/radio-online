<?php
        //En el destino colocar el correo alque quieres que lleguen los datos del contacto de tu formulario
    $destino = "ideaudio@hotmail.com";
    $nombre = $_POST["user"];
    $email = $_POST["email"];
    $mensaje = $_POST["menssage"];
    $contenido = "Nombre: " . $nombre .  "\nCorreo: " . $email ."\nAsunto: " . $mensaje;
    mail($destino, "Contacto", $contenido);
    header("Location: /vosfm");
//Esto es opcional, aqui pueden colocar un mensaje de "enviado correctamente" o redireccionarlo a algun lugar
?>