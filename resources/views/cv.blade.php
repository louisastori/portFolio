<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Louis Astori - Portfolio</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            background-color: #f9f9f9;
            color: #333;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        h1, h2, h3 {
            color: #444;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 10px;
        }
        .contact {
            margin-top: 20px;
            padding: 10px;
            background: #e9e9e9;
            border-radius: 5px;
        }
    </style>
</head>
<body>



    @include('partials.navbar')

    <div style="height: 50px;"></div>
    <img src="{{ asset('img/cv.png') }}" alt="CV" class="image-encadree">

</body>
</html>
