import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { useState } from "react";

type Props = {
    open: boolean;
    componentName: string;
    onClose: () => void;
}

const ReportDialog = ({ open, componentName, onClose }: Props) => {
    const [email, setEmail] = useState<string>("");
    const [comment, setComment] = useState<string>("")
    const handleSubmit = async () => {
        console.log(JSON.stringify({
            email,
            comment,
            component: componentName
        }))

        setEmail("");
        setComment("");
        onClose();
    }


  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
            Повідомити про проблему
        </DialogTitle>
        <DialogContent>
            <Typography mb={2}>
                Компонент: <strong>{componentName}</strong>
            </Typography>
            <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
                label="Коментар"
                type="text"
                fullWidth
                margin="normal"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={4}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>
                Скасувати
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
                Надіслати
            </Button>
        </DialogActions>
    </Dialog>
  )
}

export default ReportDialog